/**
 * Local dependencies
 */
const serializeWixBlocksToWordPressBlocks = require( './block-mapping' );

module.exports = {
	/**
	 * A name for the app, displayed to the user.
	 */
	appName: 'Blog',

	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: '14bcded7-0066-7c35-14d7-466cb3f09103',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		const statuses = [ 'published', 'unpublished', 'scheduled' ];

		const postsPromise = Promise.all(
			statuses.map( async ( status ) => {
				const posts = [];

				let offset = 0;
				const pageSize = 500;

				let page;
				let totalPosts;

				do {
					try {
						const response = await window.fetch(
							`https://manage.wix.com/_api/communities-blog-node-api/_api/posts?offset=${ offset }&size=${ pageSize }&fieldsets=categories,owner,likes,content,subscriptions,tags&status=${ status }`,
							{
								headers: { instance: config.instance },
								mode: 'same-origin',
							}
						);

						totalPosts = response.headers.get(
							'wix-socialblog-totalresults'
						);

						page = await response.json();
					} catch ( error ) {
						page = [];
					}

					Array.prototype.push.apply( posts, page );

					offset += pageSize;
				} while ( offset + pageSize <= totalPosts );

				return posts;
			} )
		);

		const authorsPromise = window
			.fetch(
				'https://manage.wix.com/_serverless/assignee-service/assignees',
				{
					credentials: 'include',
					headers: { Authorization: config.instance },
					mode: 'same-origin',
				}
			)
			.then( ( result ) => result.json() )
			.catch( () => {
				return { assignees: [] };
			} );

		const categoriesPromise = window
			.fetch(
				'https://manage.wix.com/_api/communities-blog-node-api/_api/categories?offset=0&size=500',
				{ headers: { instance: config.instance }, mode: 'same-origin' }
			)
			.then( ( result ) => result.json() )
			.catch( () => [] );

		const tagsQuery = {
			paging: {
				offset: 0,
				limit: 500,
			},
		};

		const tagsPromise = window
			.fetch(
				'https://manage.wix.com/_api/communities-blog-node-api/v2/tags/query',
				{
					method: 'POST',
					headers: { instance: config.instance },
					mode: 'same-origin',
					body: JSON.stringify( tagsQuery ),
				}
			)
			.then( ( result ) => result.json() )
			.catch( () => {
				return { tags: [] };
			} );

		const [ posts, authors, categories, tags ] = await Promise.all( [
			postsPromise,
			authorsPromise,
			categoriesPromise,
			tagsPromise,
		] );

		return {
			posts: posts.flat(),
			authors: authors.assignees,
			categories,
			tags: tags.tags,
		};
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		const { categories, tags, posts, authors } = data;
		const addedAuthors = [];

		const statusMap = {
			published: 'publish',
			unpublished: 'draft',
			scheduled: 'future',
		};

		categories.forEach( ( category ) => {
			const categoryData = {
				slug: category.slug,
				name: category.menuLabel,
			};
			if ( category.description ) {
				categoryData.description = category.description;
			}
			wxr.addCategory( categoryData );
		} );

		tags.forEach( ( tag ) =>
			wxr.addTag( {
				slug: tag.slug,
				name: tag.label,
			} )
		);

		posts.forEach( ( post ) => {
			const postAuthor = post.owner;
			// If we haven't already added this author, we need to add them now.
			if ( ! addedAuthors.includes( postAuthor.slug ) ) {
				addedAuthors.push( postAuthor.slug );

				wxr.addAuthor( {
					login: postAuthor.slug,
					display_name: authors.reduce( ( displayName, author ) => {
						if ( author.userId === postAuthor.slug ) {
							return author.displayName;
						}

						return displayName;
					}, '' ),
				} );
			}

			const postCategories = post.categories.map( ( postCategory ) => ( {
				type: 'category',
				slug: postCategory.slug,
				name: postCategory.menuLabel,
			} ) );

			const postTags = post.tags.map( ( postTag ) => ( {
				type: 'tag',
				slug: postTag.slug,
				name: postTag.label,
			} ) );

			let postContent;
			if ( 'unpublished' === post.status ) {
				postContent = post.draft.content;
			} else {
				postContent = post.content;
			}

			wxr.addPost( {
				guid: post.id,
				author: postAuthor.slug,
				date: post.firstPublishedDate,
				title: post.title,
				content: serializeWixBlocksToWordPressBlocks(
					postContent.blocks,
					{
						entityMap: postContent.entityMap,
						ownerSiteMemberId: post.ownerSiteMemberId,
					}
				),
				status: statusMap[ post.status ],
				sticky: post.isPinned ? 1 : 0,
				type: 'post',
				comment_status: post.isCommentsDisabled ? 'closed' : 'open',
				terms: [ ...postCategories, ...postTags ],
			} );
		} );
	},
};
