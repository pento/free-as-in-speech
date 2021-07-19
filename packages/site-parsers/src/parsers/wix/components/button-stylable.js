const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'StylableButton',
	parseComponent: ( component ) => {
		const link = component.dataQuery.link || {};

		return createBlock( 'core/button', {
			url: link.url,
			linkTarget: link.target,
			text: component.dataQuery.label,
		} );
	},
};
