const { createBlock } = require( '@wordpress/blocks' );
const { asyncComponentsParser } = require( '../data' );
const { Logger } = require( '../../../utils' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.StripColumnsContainer',
	parseComponent: async ( component, recursiveComponentParser ) => {
		Logger( 'wix' ).log( 'StripColumnsContainer' );

		let innerBlocks = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		if ( ! innerBlocks.length ) {
			return null;
		}

		let coverBlock = null;

		if (
			'core/column' === innerBlocks[ 0 ].name &&
			'core/cover' === innerBlocks[ 0 ].innerBlocks.name
		) {
			// The column has a cover, we need to inject the column here:
			coverBlock = innerBlocks[ 0 ];
			innerBlocks = innerBlocks[ 0 ].innerBlocks;
		}

		if ( 1 === innerBlocks.length ) {
			innerBlocks = innerBlocks[ 0 ];
		}

		if ( 'core/column' === innerBlocks.name ) {
			// Just a single column, let's unwrap it.
			innerBlocks = innerBlocks.innerBlocks;

			if ( null !== coverBlock ) {
				coverBlock.innerBlocks = innerBlocks;

				return coverBlock;
			}

			return innerBlocks;
		}

		if ( 'core/cover' === innerBlocks.name ) {
			// Just a single cover. Don't wrap with column.
			return innerBlocks;
		}

		if ( innerBlocks.length > 1 ) {
			// Real columns == more than 1, we need to wrap it with a columns block.
			const columnsBlock = createBlock( 'core/columns', {}, innerBlocks );

			if ( null !== coverBlock ) {
				coverBlock.innerBlocks = [ columnsBlock ];
				return coverBlock;
			}

			return columnsBlock;
		}

		const innerComponents = await asyncComponentsParser(
			component.components,
			recursiveComponentParser
		);

		return createBlock( 'core/column', {}, innerComponents );
	},
};
