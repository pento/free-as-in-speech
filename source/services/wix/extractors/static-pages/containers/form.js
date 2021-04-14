// const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.FormContainer',
	parseComponent: () => {
		// parseComponent: ( component, recursiveComponentParser ) => {
		// const innerBlocks = component.components
		// 	.map( recursiveComponentParser )
		// 	.flat()
		// 	.filter( Boolean );
		return null;
	},
};
