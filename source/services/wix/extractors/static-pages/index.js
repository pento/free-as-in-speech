const cheerio = require( 'cheerio' );
const { v4: uuidv4 } = require( 'uuid' );
const { pasteHandler, serialize } = require( '@wordpress/blocks' );
const slug = require( 'slugify' );

let currentObjectId = 0;
const getNextObjectId = () => {
	return ( currentObjectId += 10 );
};
const fetchPage = ( topology, editorUrl ) => ( page ) => {
	return window
		.fetch( topology.replace( '{filename}', page.pageJsonFileName ), {
			referrer: editorUrl,
			mode: 'same-origin',
			headers: {
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Upgrade-Insecure-Requests': 1,
			},
		} )
		.then( ( result ) => result.json() )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} )
		.then( ( json ) => {
			page.config = json;
			page.data = page.config.structure.components.map( ( component ) => {
				if ( ! component.dataQuery ) {
					return null;
				}
				return page.config.data.document_data[
					component.dataQuery.replace( /^#/, '' )
				];
			} );
			return page;
		} );
};

module.exports = {
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
		const url = new URL(
			'https://manage.wix.com/editor/' + config.metaSiteId
		);
		url.searchParams.set( 'editorSessionId', uuidv4() );
		url.searchParams.set( 'referralInfo', 'my-account' );

		let editorUrl;
		const metaConfigurations = await window
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
			.then( ( html ) => {
				const configData = {};

				const $ = cheerio.load( html );
				$( 'script' ).each( ( idx, scriptTag ) => {
					const currentTag = $( scriptTag );

					if ( currentTag.attr( 'src' ) !== undefined ) {
						return;
					}

					const vars = currentTag.html().split( /\s*var\s/ );
					const metaConfigurationRegExp = /^(siteHeader|editorModel)\s*=\s*(.*)$/g;

					for ( let i = 0; i < vars.length; i++ ) {
						let match;
						if (
							( match = metaConfigurationRegExp.exec(
								vars[ i ]
							) )
						) {
							const metaName = match[ 1 ];
							const metaConfigRawJSON = match[ 2 ].replace(
								/[;\s]+$/,
								''
							);
							configData[ metaName ] = JSON.parse(
								metaConfigRawJSON
							);
						}
					}
				} );

				return configData;
			} );
		if (
			undefined === metaConfigurations.siteHeader ||
			undefined === metaConfigurations.siteHeader.pageIdList
		) {
			return [];
		}
		const topology = metaConfigurations.siteHeader.pageIdList.topology[ 0 ];
		metaConfigurations.masterPage = await window
			.fetch(
				topology.replace(
					'{filename}',
					metaConfigurations.siteHeader.pageIdList
						.masterPageJsonFileName
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
		const parseMenu = ( menuItem ) => {
			menuItem = resolveQueries(
				menuItem,
				metaConfigurations.masterPage.data
			);
			let menu = {
				title: menuItem.name || menuItem.label,
			};

			if ( menuItem.link ) {
				const parsedLink = menuItem.link;
				menu = {
					...parsedLink,
					...menu,
				};

				if ( parsedLink.attachment ) {
					// this.handleAttachment( parsedLink.attachment );
				}

				if ( parsedLink.target !== '_blank' ) {
					delete menu.target;
				}
			}

			if ( menuItem.items && menuItem.items.length > 0 ) {
				menu.items = menuItem.items.map( ( menuData ) =>
					parseMenu( menuData )
				);
			}

			return menu;
		};

		const resolveQueries = ( input, data ) => {
			// skip resolving for non-objects
			if ( typeof input !== 'object' ) {
				return input;
			}

			// walk over all object keys and resolve known queries
			Object.entries( input ).forEach( ( entry ) => {
				const key = entry[ 0 ];
				const val = entry[ 1 ];
				const location = 'document_data';

				if ( Array.isArray( val ) ) {
					// Some values can be an array of things that need to get resolved
					// Example: `input.linkList = [ '#foo', '#baz' ]`
					input[ key ] = val.map( ( item ) => {
						if ( ! item || typeof item.valueOf() !== 'string' )
							return item;
						if ( item.substr( 0, 1 ) !== '#' ) return item;
						const query = item.replace( /^#/, '' );
						return query
							? resolveQueries( data[ location ][ query ], data )
							: item;
					} );
				} else if (
					val &&
					typeof val.valueOf() === 'string' &&
					val.substr( 0, 1 ) === '#'
				) {
					// Others are just a string
					// Example: `input.link = '#baz'`
					const query = val.replace( /^#/, '' );
					input[ key ] = query
						? resolveQueries( data[ location ][ query ], data )
						: val;
				}
			} );

			// Components are already objects but we need to deeply resolve their contents
			if ( input.components ) {
				input.components = input.components.map( ( subComp ) =>
					resolveQueries( subComp, data )
				);
			}

			return input;
		};

		const handleMenuItemsRecursively = ( menu, items, parent = 0 ) => {
			const results = [];
			items.forEach( ( item ) => {
				const id = getNextObjectId();

				if ( ! item.type ) {
					item.type = 'custom';
					item.object = 'custom';
					item.objectId = id;
				} else if ( 'PageLink' === item.type ) {
					item.type = 'post_type';
				}

				results.push( {
					id,
					title: item.title || '',
					date: Date.now(),
					name: item.title ? slug( item.title, { lower: true } ) : '',
					type: 'nav_menu_item',
					menuOrder: menu.counter++,
					meta: {
						_menu_item_type: item.type,
						_menu_item_menu_item_parent: parent,
						_menu_item_object_id: item.objectId,
						_menu_item_object: item.object,
						_menu_item_target: item.target || '',
						_menu_item_classes: item.classes || '',
						_menu_item_url: item.url || '',
						_menu_item_xfn: '',
					},
					terms: [ { type: 'nav_menu', ...menu } ],
				} );

				if ( Array.isArray( item.items ) ) {
					results.push(
						...handleMenuItemsRecursively( menu, item.items, id )
					);
				}
			} );
			return results;
		};

		const posts = await Promise.all(
			metaConfigurations.siteHeader.pageIdList.pages.map(
				fetchPage( topology, editorUrl )
			)
		);

		const menus = [];
		const menuItem =
			metaConfigurations.masterPage.data.document_data.CUSTOM_MAIN_MENU;
		if ( menuItem ) {
			menus.push( {
				role: 'main',
				...parseMenu( menuItem ),
			} );
		}

		menus.forEach( ( menu ) => {
			const term = {
				id: getNextObjectId(),
				name: menu.title,
				slug: slug( `${ menu.title }-1`, { lower: true } ),
				counter: 0,
				meta: {
					menu_role: menu.role || null,
					parsing_session_id: 1,
				},
			};
			posts.push( ...handleMenuItemsRecursively( term, menu.items ) );
		} );

		return posts;
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		data.forEach( ( post ) => {
			if ( post.type === 'nav_menu_item' ) {
				post.terms.forEach( ( term ) => {
					term.taxonomy = term.type;
					wxr.addTerm( term );
				} );

				wxr.addPost( {
					title: post.title,
					type: post.type,
					terms: post.terms,
					menu_order: post.menuOrder,
					meta: Object.entries( post.meta ).map( ( meta ) => ( {
						key: meta[ 0 ],
						value: meta[ 1 ],
					} ) ),
				} );

				return;
			}
			wxr.addPost( {
				title: post.title,
				content: pasteHandler( {
					HTML: post.data
						.map( ( item ) => ( item && item.text ) || '' )
						.join( '' ),
					mode: 'BLOCKS',
				} )
					.filter( ( blockContent ) => blockContent !== false )
					.map( ( wpBlock ) => serialize( wpBlock ) )
					.join( '\n\n' ),
				status: 'publish',
				sticky: 0,
				type: 'page',
				comment_status: 'closed',
			} );
		} );
	},
};
