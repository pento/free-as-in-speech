const { createBlock } = require( '@wordpress/blocks' );
const { parseWixLink, getHtmlLinkAttributes } = require( '../links.js' );

module.exports = {
	type: 'LinkableButton',
	parseComponent: ( component, addMediaAttachment, metaData, page ) => {
		const link = parseWixLink( component.link, metaData );
		const attrs = getHtmlLinkAttributes( link, page.pageId );
		attrs.url = attrs.href;
		return createBlock( 'core/buttons', {}, [
			createBlock( 'core/button', {
				...attrs,
				text: component.label,
			} ),
		] );
	},
};
