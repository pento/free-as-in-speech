const { createBlock } = require( '@wordpress/blocks' );
const { asyncComponentsParser } = require( '../data' );

module.exports = {
	componentType: 'mobile.core.components.Container',
	parseComponent: async ( component, recursiveComponentParser ) => {
		const innerComponents = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		return createBlock( 'core/group', {}, innerComponents );
	},
};
