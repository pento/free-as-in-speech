const { createBlock } = require( '@wordpress/blocks' );
const { asyncComponentsParser } = require( '../data' );
const { Logger } = require( '../../../utils' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.Column',
	parseComponent: async ( component, recursiveComponentParser ) => {
		Logger( 'wix' ).log( 'ColumnContainer' );

		const innerComponents = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		return createBlock( 'core/column', {}, innerComponents );
	},
};
