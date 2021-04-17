const { v4: uuidv4 } = require( 'uuid' );
const { createBlock, pasteHandler, serialize } = require( '@wordpress/blocks' );
const slug = require( 'slugify' );
const IdFactory = require( '../../../../utils/idfactory.js' );
const {
	extractConfigData,
	fetchPageJson,
	resolveQueries,
} = require( './data.js' );
const { convertMenu } = require( './menu.js' );
const { parseWixLink, getHtmlLinkAttributes } = require( './links.js' );

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

			const id = IdFactory.get( component.name || component.uri );
			data.attachments.push( {
				id,
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
			} );
			return id;
		};

		const maybeAddCoverBlock = ( component, innerBlocks ) => {
			if ( innerBlocks.name === 'core/cover' ) {
				return innerBlocks;
			}
			if (
				component.designQuery &&
				component.designQuery.background &&
				component.designQuery.background.mediaRef
			) {
				// If a background is defined, let's make this a cover block.
				const id = addMediaAttachment(
					component.designQuery.background.mediaRef
				);

				if (
					innerBlocks.length === 1 &&
					'core/column' === innerBlocks[ 0 ].name
				) {
					innerBlocks = innerBlocks[ 0 ].innerBlocks;
				}

				return createBlock(
					'core/cover',
					{
						url:
							metaData.serviceTopology.staticMediaUrl +
							'/' +
							component.designQuery.background.mediaRef.uri,
						id,
						align:
							component.designQuery.background.fittingType ===
							'fill'
								? 'full'
								: 'center',
					},
					innerBlocks
				);
			}
			return innerBlocks;
		};

		data.pages.forEach( ( page ) => {
			const parseComponent = ( component ) => {
				component = resolveQueries(
					component,
					page.config.data,
					masterPage.data
				);

				if ( component.components ) {
					let innerBlocks;
					if (
						'wysiwyg.viewer.components.Column' ===
						component.componentType
					) {
						innerBlocks = component.components
							.map( parseComponent )
							.flat()
							.filter( Boolean );

						return maybeAddCoverBlock(
							component,
							createBlock( 'core/column', {}, innerBlocks )
						);
					}

					if (
						'wysiwyg.viewer.components.StripColumnsContainer' ===
						component.componentType
					) {
						innerBlocks = component.components.map(
							parseComponent
						);

						if ( innerBlocks.length > 0 ) {
							let coverBlock = null;

							if (
								'core/cover' === innerBlocks[ 0 ].name &&
								'core/column' ===
									innerBlocks[ 0 ].innerBlocks.name
							) {
								// The column is has a cover, we need to inject the column here:
								coverBlock = innerBlocks[ 0 ];
								innerBlocks = innerBlocks[ 0 ].innerBlocks;
							}

							if ( 1 === innerBlocks.length ) {
								innerBlocks = innerBlocks[ 0 ];
							}

							if ( 'core/column' === innerBlocks.name ) {
								// Just a single column, let's unwrap it.
								innerBlocks = innerBlocks.innerBlocks;

								if ( null !== coverBlock ) {
									coverBlock.innerBlocks = innerBlocks;
									return coverBlock;
								}

								return innerBlocks;
							}

							if ( innerBlocks.length > 1 ) {
								// Real columns == more than 1, we need to wrap it with a columns block.
								const columnsBlock = createBlock(
									'core/columns',
									{},
									innerBlocks
								);

								if ( null !== coverBlock ) {
									coverBlock.innerBlocks = [ columnsBlock ];
									return coverBlock;
								}

								return columnsBlock;
							}
						}
					} else {
						innerBlocks = component.components
							.map( parseComponent )
							.flat()
							.filter( Boolean );
					}

					return maybeAddCoverBlock( component, innerBlocks );
				}

				component = component.dataQuery;
				if ( component ) {
					switch ( component.type ) {
						case 'Image':
							if ( ! component.uri ) {
								break;
							}

							component.src =
								metaData.serviceTopology.staticMediaUrl +
								'/' +
								component.uri;
							addMediaAttachment( component );

							return createBlock( 'core/image', {
								url: component.src,
								alt: component.alt,
								width: component.width,
								height: component.height,
							} );

						case 'StyledText':
							// Already has the proper HTML that can be converted below.
							break;
						case 'LinkableButton':
							const link = parseWixLink(
								component.link,
								metaData
							);
							const attrs = getHtmlLinkAttributes(
								link,
								page.pageId
							);
							attrs.url = attrs.href;
							return createBlock( 'core/buttons', {}, [
								createBlock( 'core/button', {
									...attrs,
									text: component.label,
								} ),
							] );
						case 'TextInput':
							return createBlock( 'jetpack/field-text', {
								label: component.label,
							} );
					}

					if ( component.text ) {
						return pasteHandler( { HTML: component.text } );
					}
				}

				return null;
			};

			page.content = page.config.structure.components
				.map( parseComponent )
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
