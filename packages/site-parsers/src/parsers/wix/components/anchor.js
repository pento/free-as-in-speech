const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'Anchor',
	parseComponent: ( component ) => {
		const dataQuery = component.dataQuery;

		if ( dataQuery && dataQuery.type === 'Anchor' && dataQuery.name ) {
			return createBlock( 'core/paragraph', {
				id: dataQuery.name,
			} );
		}
	},
};
