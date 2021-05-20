const slug = require( 'slugify' );

const IdFactory = require( '../../../utils/idfactory' );
const { resolveQueries } = require( '../data' );

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

const convertMenu = ( data, masterPage ) => {
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

	data.menus = pages;
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

module.exports = { handleMenuItemsRecursively, convertMenu, parseMenu };
