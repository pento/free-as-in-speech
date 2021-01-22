/**
 * Local dependencies
 */
import { serializeWixBlocksToWordPressBlocks } from './block-mapping';

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

		const postsPromise = Promise.all(
			statuses.map( ( status ) =>
				window
					.fetch(
						`https://manage.wix.com/_api/communities-blog-node-api/_api/posts?offset=0&size=500&fieldsets=categories,owner,likes,content,subscriptions,tags&status=${ status }`,
						{
							headers: { instance: config.instance },
							mode: 'same-origin',
						}
					)
					.then( ( result ) => result.json() )
			)
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
			.then( ( result ) => result.json() );

		const categoriesPromise = window
			.fetch(
				'https://manage.wix.com/_api/communities-blog-node-api/_api/categories?offset=0&size=500',
				{ headers: { instance: config.instance }, mode: 'same-origin' }
			)
			.then( ( result ) => result.json() );

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
			.then( ( result ) => result.json() );

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
				id: postId,
				guid: post.id,
				author: postAuthor.slug,
				date: post.firstPublishedDate,
				title: post.title,
				content: serializeWixBlocksToWordPressBlocks( postContent ),
				status: statusMap[ post.status ],
				sticky: post.isPinned ? 1 : 0,
				type: 'post',
				comment_status: post.isCommentsDisabled ? 'closed' : 'open',
				terms: [ ...postCategories, ...postTags ],
			} );
		} );
	},
};
