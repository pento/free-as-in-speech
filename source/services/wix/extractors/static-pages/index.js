const { v4: uuidv4 } = require( 'uuid' );
const { extractConfigData, fetchPageJson } = require( './data.js' );
const { staticPagesParserWix } = require( 'fetch-as-har' );

module.exports = {
	/**
	 * A name for the app, displayed to the user.
	 */
	appName: 'Static Pages',

	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: 'static-pages',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		const data = {
			pages: [],
			menus: [],
			attachments: {},
			objects: [],
		};

		const url = new URL(
			'https://manage.wix.com/editor/' + config.metaSiteId
		);
		url.searchParams.set( 'editorSessionId', uuidv4() );
		url.searchParams.set( 'referralInfo', 'my-account' );

		let editorUrl;
		const metaData = await window
			.fetch( url, {
				credentials: 'include',
				referrer:
					'https://manage.wix.com/dashboard/' +
					config.metaSiteId +
					'/home?referralInfo=my-sites',
				mode: 'same-origin',
				headers: {
					Accept:
						'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Upgrade-Insecure-Requests': 1,
				},
			} )
			.then( ( result ) => {
				editorUrl = result.url;
				return result.text();
			} )
			.then( extractConfigData );

		if (
			undefined === metaData.siteHeader ||
			undefined === metaData.siteHeader.pageIdList
		) {
			return data;
		}

		// This is used to construct a URL from the filename, see fetchPageJson().
		const topology = metaData.siteHeader.pageIdList.topology[ 0 ];

		// The masterPage contains the id to object mapping as well as metadata like the site menu.
		const masterPage = await window
			.fetch(
				topology.replace(
					'{filename}',
					metaData.siteHeader.pageIdList.masterPageJsonFileName
				),
				{
					credentials: 'include',
					referrer: editorUrl,
					mode: 'same-origin',
					headers: {
						Accept:
							'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'Upgrade-Insecure-Requests': 1,
					},
				}
			)
			.then( ( result ) => result.json() )
			.catch( () => {} );

		// Fetch the pages as Json.
		const pages = await Promise.all(
			metaData.siteHeader.pageIdList.pages.map(
				fetchPageJson( topology, editorUrl )
			)
		);

		return staticPagesParserWix( metaData, masterPage, pages );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		data.objects.forEach( ( obj ) => {
			wxr.addObject( obj.type, obj.data );
		} );
		data.pages.forEach( ( post ) => {
			const terms = post.terms || [];

			terms.forEach( ( term ) => {
				term.taxonomy = term.type;
				wxr.addTerm( term );
			} );

			wxr.addPost( {
				id: post.postId,
				title: post.title,
				name: slug( post.title ),
				content: post.content,
				status: post.hidePage ? 'private' : 'publish',
				sticky: 0,
				type: post.postType || 'page',
				comment_status: 'closed',
				meta: Object.entries( post.meta || {} ).map( ( meta ) => ( {
					key: meta[ 0 ],
					value:
						typeof meta[ 1 ] === 'object'
							? JSON.stringify( meta[ 1 ] )
							: meta[ 1 ],
				} ) ),
				terms,
			} );
		} );
		data.menus.forEach( ( post ) => {
			if ( 'pending' === post.status ) {
				// Skip hidden menu entries.
				return;
			}
			post.terms.forEach( ( term ) => {
				term.taxonomy = term.type;
				wxr.addTerm( term );
			} );
			wxr.addPost( {
				id: post.postId,
				title: post.title,
				type: post.type,
				terms: post.terms,
				parent: post.parent,
				status: post.status,
				menu_order: post.menuOrder,
				meta: Object.entries( post.meta ).map( ( meta ) => ( {
					key: meta[ 0 ],
					value: meta[ 1 ],
				} ) ),
			} );
		} );
		Object.values( data.attachments ).forEach( ( post ) => {
			wxr.addPost( post );
		} );
	},
};
