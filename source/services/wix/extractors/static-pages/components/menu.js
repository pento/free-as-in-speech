const { createBlock } = require( '@wordpress/blocks' );
const { parseWixLink } = require( '../links.js' );

const parseMenuRecursively = ( menuItem, resolver ) => {
	menuItem = resolver( menuItem );
	if ( ! menuItem.isVisible ) {
		return null;
	}
	const attributes = {
		label: menuItem.name || menuItem.label,
	};
	let innerBlocks = [];

	if ( menuItem.link ) {
		const parsedLink = parseWixLink( menuItem.link );
		// We're not using this data for now since the post ids not being rewritten,
		// resulting in the menu items to be hidden because these seemingly arbitrary
		// post ids lead to posts that are not published.
		//
		// if ( 'post_type' === parsedLink.type ) {
		// 	attributes.type = parsedLink.object;
		// 	attributes.id = parsedLink.objectId;
		// }

		attributes.url = parsedLink.url;
	}

	if ( menuItem.items && menuItem.items.length > 0 ) {
		innerBlocks = menuItem.items
			.map( ( menuData ) => parseMenuRecursively( menuData, resolver ) )
			.filter( Boolean );
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
				menuItems = component.dataQuery.menuRef.items
					.map( ( menuData ) =>
						parseMenuRecursively( menuData, resolver )
					)
					.filter( Boolean );
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
