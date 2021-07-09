const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'StylableButton',
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'StylableButton' );

		return createBlock( 'core/button', {
			url: component.dataQuery.link.url,
			linkTarget: component.dataQuery.link.target,
			text: component.dataQuery.label,
		} );
	},
};
