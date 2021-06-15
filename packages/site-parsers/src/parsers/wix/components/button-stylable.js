const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'StylableButton',
	parseComponent: ( component ) => {
		return createBlock( 'core/button', {
			url: component.dataQuery.link.url,
			linkTarget: component.dataQuery.link.target,
			text: component.dataQuery.label,
		} );
	},
};
