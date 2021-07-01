const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'FiveGridLine',
	parseComponent: () => {
		Logger( 'wix' ).log( 'FiveGridLine' );

		return createBlock( 'core/separator' );
	},
};
