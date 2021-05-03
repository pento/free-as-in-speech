const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'Image',
	parseComponent: ( component, { addMediaAttachment } ) => {
		if ( ! component.dataQuery || ! component.dataQuery.uri ) {
			return null;
		}

		const attachment = addMediaAttachment( component.dataQuery );

		return createBlock( 'core/image', {
			url: attachment.guid,
			alt: component.dataQuery.alt,
			width: component.dataQuery.width,
			height: component.dataQuery.height,
		} );
	},
};
