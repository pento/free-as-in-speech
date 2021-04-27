const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.StripColumnsContainer',
	parseComponent: ( component, recursiveComponentParser ) => {
		let innerBlocks = component.components.map( recursiveComponentParser );

		if ( ! innerBlocks.length ) {
			return null;
		}

		let coverBlock = null;

		if (
			'core/cover' === innerBlocks[ 0 ].name &&
			'core/column' === innerBlocks[ 0 ].innerBlocks.name
		) {
			// The column is has a cover, we need to inject the column here:
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

		if ( innerBlocks.length > 1 ) {
			// Real columns == more than 1, we need to wrap it with a columns block.
			const columnsBlock = createBlock( 'core/columns', {}, innerBlocks );

			if ( null !== coverBlock ) {
				coverBlock.innerBlocks = [ columnsBlock ];
				return coverBlock;
			}

			return columnsBlock;
		}

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
