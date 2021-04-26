const { v4: uuidv4 } = require( 'uuid' );
const { serialize } = require( '@wordpress/blocks' );
const slug = require( 'slugify' );
const IdFactory = require( '../../../../utils/idfactory.js' );
const {
	extractConfigData,
	fetchPageJson,
	resolveQueries,
} = require( './data.js' );
const { convertMenu } = require( './menu.js' );
const { maybeAddCoverBlock } = require( './containers/cover.js' );
const { containerMapper, componentMapper } = require( './mappers.js' );

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
			attachments: [],
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
		data.pages = await Promise.all(
			metaData.siteHeader.pageIdList.pages.map(
				fetchPageJson( topology, editorUrl )
			)
		);

		const addMediaAttachment = ( component ) => {
			if ( IdFactory.exists( component.name || component.uri ) ) {
				return;
			}

			component.src =
				metaData.serviceTopology.staticMediaUrl + '/' + component.uri;

			const attachment = {
				id: IdFactory.get( component.name || component.uri ),
				title: component.alt,
				excerpt: component.description || '',
				content: component.description || '',
				link: component.src,
				guid: component.src,
				commentStatus: 'closed',
				name: slug( component.name || component.uri ),
				type: 'attachment',
				attachment_url: component.src,
				meta: [
					{
						key: '_wp_attachment_attachment_alt',
						value: component.alt || null,
					},
				],
			};
			data.attachments.push( attachment );
			return attachment;
		};

		data.pages.forEach( ( page ) => {
			const recursiveComponentParser = ( component ) => {
				component = resolveQueries(
					component,
					page.config.data,
					masterPage.data
				);

				if ( component.components ) {
					return maybeAddCoverBlock(
						containerMapper( component, recursiveComponentParser ),
						addMediaAttachment
					);
				}

				return componentMapper(
					component,
					addMediaAttachment,
					metaData,
					page
				);
			};

			page.content = page.config.structure.components
				.map( recursiveComponentParser )
				.flat()
				.filter( Boolean )
				.map( ( wpBlock ) => serialize( wpBlock ) )
				.join( '\n\n' );
		} );

		data.menus = convertMenu( masterPage );
		return data;
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		data.pages.forEach( ( post ) => {
			wxr.addPost( {
				id: post.postId,
				title: post.title,
				content: post.content,
				status: post.hidePage ? 'private' : 'publish',
				sticky: 0,
				type: 'page',
				comment_status: 'closed',
				meta: Object.entries( post.meta || {} ).map( ( meta ) => ( {
					key: meta[ 0 ],
					value:
						typeof meta[ 1 ] === 'object'
							? JSON.stringify( meta[ 1 ] )
							: meta[ 1 ],
				} ) ),
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
		data.attachments.forEach( ( post ) => {
			wxr.addPost( post );
		} );
	},
};
