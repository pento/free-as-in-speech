const { createBlock } = require( '@wordpress/blocks' );
const { parseComponent: parseDocumentMedia } = require( './document-media' );

const parseImage = ( component, { metaData, addMediaAttachment } ) => {
	if ( ! component.dataQuery || ! component.dataQuery.uri ) {
		return null;
	}

	const attachment = addMediaAttachment(
		metaData.serviceTopology.staticMediaUrl,
		component.dataQuery
	);

	return createBlock( 'core/image', {
		url: attachment.guid,
		alt: component.dataQuery.alt,
		width: component.dataQuery.width,
		height: component.dataQuery.height,
	} );
};

module.exports = {
	type: 'Image',
	// eslint-disable-next-line
	parseComponent: function ( component ) {
		switch ( component.componentType ) {
			case 'wysiwyg.viewer.components.documentmedia.DocumentMedia':
				return parseDocumentMedia( ...arguments );

			default:
				return parseImage( ...arguments );
		}
	},
};
