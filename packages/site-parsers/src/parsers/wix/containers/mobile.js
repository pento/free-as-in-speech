const { createBlock } = require( '@wordpress/blocks' );
const { asyncComponentsParser } = require( '../data' );
const { Logger } = require( '../../../utils' );

module.exports = {
	componentType: 'mobile.core.components.Container',
	parseComponent: async ( component, recursiveComponentParser ) => {
		Logger( 'wix' ).log( 'MobileContainer' );

		const innerComponents = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		return createBlock( 'core/group', {}, innerComponents );
	},
};
