export const settings = {
	/**
	 * The Wix application ID.
	 */
	appId: 10297,

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		const statuses = [ 'published', 'unpublished', 'scheduled' ];

		const posts = await Promise.all(
			statuses.map( ( status ) =>
				window
					.fetch(
						`https://www.wix.com/_api/communities-blog-node-api/_api/posts?offset=0&size=10&fieldsets=categories,owner,likes,content,subscriptions,tags&status=${ status }`,
						{ headers: { instance: config.instance } }
					)
					.then( ( result ) => result.json() )
			)
		);

		const authors = await window
			.fetch(
				'https://www.wix.com/_serverless/assignee-service/assignees',
				{
					credentials: 'include',
					headers: { Authorization: config.instance },
				}
			)
			.then( ( result ) => result.json() );

		return {
			posts: posts.flat(),
			authors: authors.assignees,
		};
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		const { posts, authors } = data;
		const addedAuthors = [];

		const statusMap = {
			published: 'publish',
			unpublished: 'draft',
			scheduled: 'future',
		};

		posts.forEach( ( post, postId ) => {
			const postAuthor = post.owner;
			// If we haven't already added this author, we need to add them now.
			if ( ! addedAuthors.includes( postAuthor.siteMemberId ) ) {
				addedAuthors.push( postAuthor.siteMemberId );

				wxr.addAuthor( {
					login: postAuthor.slug,
					display_name: authors.reduce( ( displayName, author ) => {
						if ( author.userId === postAuthor.siteMemberId ) {
							return author.displayName;
						}

						return displayName;
					}, '' ),
				} );
			}

			let postContent;
			if ( 'unpublished' === post.status ) {
				postContent = post.draft.content;
			} else {
				postContent = post.content;
			}

			const content = postContent.blocks
				.map( ( block ) => {
					switch ( block.type ) {
						case 'unstyled':
							return `<p>${ block.text }</p>`;
					}
					return false;
				} )
				.filter( ( blockContent ) => blockContent !== false )
				.join( '\n\n' );

			wxr.addPost( {
				id: postId,
				guid: post.id,
				author: postAuthor.slug,
				date: post.firstPublishedDate,
				title: post.title,
				content,
				status: statusMap[ post.status ],
				sticky: post.isPinned ? 1 : 0,
				type: 'post',
				comment_status: post.isCommentsDisabled ? 'closed' : 'open',
			} );
		} );
	},
};
