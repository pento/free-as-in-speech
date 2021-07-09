const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'Anchor',
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'Anchor' );
		const dataQuery = component.dataQuery;

		if ( dataQuery && dataQuery.type === 'Anchor' && dataQuery.name ) {
			return createBlock( 'core/paragraph', {
				id: dataQuery.name,
			} );
		}
	},
};
