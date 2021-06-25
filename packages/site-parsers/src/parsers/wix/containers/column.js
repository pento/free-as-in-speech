const { createBlock } = require( '@wordpress/blocks' );
const { asyncComponentsParser } = require( '../data' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.Column',
	parseComponent: async ( component, recursiveComponentParser ) => {
		const innerComponents = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		return createBlock( 'core/column', {}, innerComponents );
	},
};
