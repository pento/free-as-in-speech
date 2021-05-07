const { createBlock } = require( '@wordpress/blocks' );
const { parseWixLink } = require( '../links.js' );

const parseMenuRecursively = ( menuItem, resolver ) => {
	menuItem = resolver( menuItem );
	const attributes = {
		label: menuItem.name || menuItem.label,
	};
	let innerBlocks = [];

	if ( menuItem.link ) {
		const parsedLink = parseWixLink( menuItem.link );
		if ( 'post_type' === parsedLink.type ) {
			attributes.type = parsedLink.object;
			attributes.id = parsedLink.objectId;
		}
		attributes.url = parsedLink.url;
	}

	if ( menuItem.items && menuItem.items.length > 0 ) {
		innerBlocks = menuItem.items.map( ( menuData ) =>
			parseMenuRecursively( menuData, resolver )
		);
	}

	return createBlock( 'core/navigation-link', attributes, innerBlocks );
};

module.exports = {
	type: 'CustomMenuDataRef',
	parseComponent: ( component, { resolver } ) => {
		try {
			let menuItems = [];
			if (
				component.dataQuery.menuRef &&
				component.dataQuery.menuRef.items
			) {
				menuItems = component.dataQuery.menuRef.items.map(
					( menuData ) => parseMenuRecursively( menuData, resolver )
				);
			}
			return createBlock(
				'core/navigation',
				{
					orientation: 'horizontal',
				},
				menuItems
			);
		} catch ( e ) {
			return null;
		}
	},
};
