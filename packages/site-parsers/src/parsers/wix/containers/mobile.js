const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'mobile.core.components.Container',
	parseComponent: ( component, recursiveComponentParser ) => {
		return createBlock(
			'core/group',
			{},
			component.components
				.map( recursiveComponentParser )
				.flat()
				.filter( Boolean )
		);
	},
};
