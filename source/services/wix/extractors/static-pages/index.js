const cheerio = require( 'cheerio' );
const { v4: uuidv4 } = require( 'uuid' );
const { pasteHandler, serialize } = require( '@wordpress/blocks' );
const slug = require( 'slugify' );
const IdFactory = require( '../../../../utils/idfactory.js' );

const escHtml = ( text ) =>
	String( text )
		.replace( /"/g, '&quot;' )
		.replace( /&/g, '&amp;' )
		.replace( />/g, '&gt;' )
		.replace( /</g, '&lt;' );

const extractConfigData = ( html ) => {
	const configData = {};

	// The configuration data is embedded in script tags in the HTML.
	const $ = cheerio.load( html );
	$( 'script' ).each( ( idx, scriptTag ) => {
		const currentTag = $( scriptTag );

		if ( currentTag.attr( 'src' ) !== undefined ) {
			return;
		}

		const vars = currentTag.html().split( /\s*var\s/ );
		const metaConfigurationRegExp = /^(siteHeader|editorModel|serviceTopology)\s*=\s*(.*)$/;

		for ( let i = 0; i < vars.length; i++ ) {
			let match;
			if ( ( match = metaConfigurationRegExp.exec( vars[ i ] ) ) ) {
				const metaName = match[ 1 ];
				const metaConfigRawJSON = match[ 2 ].replace( /[;\s]+$/, '' );
				configData[ metaName ] = JSON.parse( metaConfigRawJSON );
			}
		}
	} );

	return configData;
};

const handleMenuItemsRecursively = ( menu, items, parent = 0 ) => {
	const results = [];
	items.forEach( ( item ) => {
		const id = IdFactory.get( item.title );

		if ( ! item.type ) {
			item.type = 'custom';
			item.object = 'custom';
			item.objectId = IdFactory.get( item.title );
		} else if ( 'PageLink' === item.type ) {
			item.type = 'post_type';
			item.objectId = IdFactory.get( item.pageId.id );
			item.status = item.pageId.hidePage ? 'pending' : 'publish';
			item.object = 'page';
		}

		results.push( {
			postId: id,
			title: item.title || '',
			date: Date.now(),
			name: item.title ? slug( item.title, { lower: true } ) : '',
			type: 'nav_menu_item',
			parent,
			status: item.status || 'publish',
			menuOrder: menu.counter++,
			meta: {
				_menu_item_type: item.type,
				_menu_item_menu_item_parent: String( parent ? parent : '' ),
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

const convertMenu = ( masterPage ) => {
	const menus = [];
	const pages = [];

	const menuItem = masterPage.data.document_data.CUSTOM_MAIN_MENU;
	if ( menuItem ) {
		menus.push( {
			role: 'main',
			...parseMenu( menuItem, masterPage ),
		} );
	}

	menus.forEach( ( menu ) => {
		const term = {
			id: IdFactory.get( menu.title ),
			name: menu.title,
			slug: slug( `${ menu.title }-1`, { lower: true } ),
			counter: 0,
			meta: {
				menu_role: menu.role || null,
				parsing_session_id: 1,
			},
		};

		pages.push( ...handleMenuItemsRecursively( term, menu.items ) );
	} );

	return pages;
};

const parseMenu = ( menuItem, masterPage ) => {
	menuItem = resolveQueries( menuItem, masterPage.data );
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
			// handleAttachment( parsedLink.attachment );
		}

		if ( parsedLink.target !== '_blank' ) {
			delete menu.target;
		}
	}

	if ( menuItem.items && menuItem.items.length > 0 ) {
		menu.items = menuItem.items.map( ( menuData ) =>
			parseMenu( menuData, masterPage )
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
				if ( ! item || typeof item.valueOf() !== 'string' ) return item;
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

const fetchPageJson = ( topology, editorUrl ) => ( page ) => {
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
			page.postId = IdFactory.get( page.pageId );
			page.config = json;
			return page;
		} )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} );
};

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
			return [];
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
		const data = {
			pages: await Promise.all(
				metaData.siteHeader.pageIdList.pages.map(
					fetchPageJson( topology, editorUrl )
				)
			),
			menus: [],
			attachments: [],
		};

		data.pages.forEach( ( page ) => {
			const parseComponent = ( component ) => {
				component = resolveQueries( component, page.config.data )
					.dataQuery;
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
							component.text =
								'<img src="' +
								escHtml( component.src ) +
								'" alt="' +
								escHtml( component.alt ) +
								'" width="' +
								escHtml( component.width ) +
								'" height="' +
								escHtml( component.height ) +
								'" />';

							if ( IdFactory.exists( component.name ) ) {
								break;
							}
							data.attachments.push( {
								id: IdFactory.get(
									component.name || component.uri
								),
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
							break;
					}
				}

				return component;
			};

			const components = page.config.structure.components.map(
				parseComponent
			);

			page.content = pasteHandler( {
				HTML: components
					.map( ( item ) => ( item && item.text ) || '' )
					.join( '' ),
				mode: 'BLOCKS',
			} )
				.filter( ( blockContent ) => blockContent !== false )
				.map( ( wpBlock ) => {
					// console.log( wpBlock );
					return serialize( wpBlock );
				} )
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
