const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'Image',
	parseComponent: ( component, addMediaAttachment ) => {
		if ( ! component.uri ) {
			return null;
		}
		const attachment = addMediaAttachment( component );

		return createBlock( 'core/image', {
			url: attachment.src,
			alt: component.alt,
			width: component.width,
			height: component.height,
		} );
	},
};
