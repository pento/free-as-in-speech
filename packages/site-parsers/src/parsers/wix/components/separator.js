const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'FiveGridLine',
	parseComponent: () => {
		createBlock( 'core/separator' );
	},
};
