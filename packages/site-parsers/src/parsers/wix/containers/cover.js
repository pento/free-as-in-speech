const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	maybeAddCoverBlock: ( component, { metaData, addMediaAttachment } ) => {
		if ( ! component || ! component.innerBlocks ) {
			return component;
		}
		let innerBlocks = component.innerBlocks;

		if ( innerBlocks.name === 'core/cover' ) {
			return innerBlocks;
		}

		if (
			component.designQuery &&
			component.designQuery.background &&
			component.designQuery.background.mediaRef
		) {
			Logger( 'wix' ).log( 'CoverContainer' );

			// If a background is defined, let's make this a cover block.
			const attachment = addMediaAttachment(
				metaData.serviceTopology.staticMediaUrl,
				component.designQuery.background.mediaRef
			);

			if (
				innerBlocks.length === 1 &&
				'core/column' === innerBlocks[ 0 ].name
			) {
				innerBlocks = innerBlocks[ 0 ].innerBlocks;
			}

			return createBlock(
				'core/cover',
				{
					url: attachment.guid,
					id: attachment.id,
					align:
						component.designQuery.background.fittingType === 'fill'
							? 'full'
							: 'center',
				},
				innerBlocks
			);
		}
		return component;
	},
};
