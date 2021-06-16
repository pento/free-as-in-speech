const { createBlock } = require( '@wordpress/blocks' );

/**
 * The parent component handler is ./image.js
 * componentType: DocumentMedia
 */
module.exports = {
	parseComponent: ( component, { addMediaAttachment } ) => {
		if ( ! component.dataQuery.link ) {
			return null;
		}

		const attachment = addMediaAttachment( {
			uri: component.dataQuery.link.docId,
			name: component.dataQuery.link.name,
			alt: component.dataQuery.title,
		} );

		return createBlock( 'core/file', {
			id: attachment.id,
			href: attachment.link,
			fileName: attachment.name,
			textLinkHref: attachment.title,
			downloadButtonText: attachment.name,
		} );
	},
};
