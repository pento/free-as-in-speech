const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.Column',
	parseComponent: ( component, recursiveComponentParser ) => {
		return createBlock(
			'core/column',
			{},
			component.components
				.map( recursiveComponentParser )
				.flat()
				.filter( Boolean )
		);
	},
};
