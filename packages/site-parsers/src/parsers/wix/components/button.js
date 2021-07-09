const { createBlock } = require( '@wordpress/blocks' );
const { parseWixLink, getHtmlLinkAttributes } = require( '../links.js' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'LinkableButton',
	parseComponent: ( component, { metaData, page } ) => {
		Logger( 'wix' ).log( 'LinkableButton' );

		const link = parseWixLink( component.dataQuery.link, metaData );
		const attrs = getHtmlLinkAttributes( link, page.pageId );
		attrs.url = attrs.href;

		return createBlock( 'core/buttons', {}, [
			createBlock( 'core/button', {
				...attrs,
				text: component.dataQuery.label,
			} ),
		] );
	},
};
