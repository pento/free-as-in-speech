const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'CustomMenuDataRef',
	parseComponent: () => {
		try {
			return createBlock( 'core/navigation', {
				orientation: 'horizontal',
			} );
		} catch ( e ) {
			return null;
		}
	},
};
