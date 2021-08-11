const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'StylableButton',
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'StylableButton' );
		const link = component.dataQuery.link || {};

		return createBlock( 'core/button', {
			url: link.url,
			linkTarget: link.target,
			text: component.dataQuery.label,
		} );
	},
};
