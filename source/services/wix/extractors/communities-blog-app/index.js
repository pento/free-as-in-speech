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
	extract: ( config ) => {
		return window
			.fetch(
				'https://www.wix.com/_api/communities-blog-node-api/_api/posts?offset=0&size=10&fieldsets=categories,owner,likes,content,subscriptions,tags',
				{ headers: { instance: config.instance } }
			)
			.then( ( result ) => {
				return result.json();
			} );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: ( data, wxr ) => {
		wxr.addAuthor( {
			login: 'pento',
			email: 'gary@pento.net',
		} );

		data.forEach( ( post ) => {
			const content = post.content.blocks
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
				title: post.title,
				contentEncoded: content,
				author: 'pento',
			} );
		} );
	},
};
