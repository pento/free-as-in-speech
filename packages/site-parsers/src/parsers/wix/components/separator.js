const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'FiveGridLine',
	parseComponent: () => {
		return createBlock( 'core/separator' );
	},
};
