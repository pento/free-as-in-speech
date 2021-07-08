const { createBlock } = require( '@wordpress/blocks' );

/**
 * The parent component handler is ./image.js
 * componentType: DocumentMedia
 */
module.exports = {
	parseComponent: ( component, { metaData, addMediaAttachment } ) => {
		if ( ! component.dataQuery.link ) {
			return null;
		}

		const mediaUrl = metaData.serviceTopology.staticHTMLComponentUrl.replace(
			/\/$/,
			''
		);
		const attachment = addMediaAttachment( mediaUrl, {
			uri: component.dataQuery.link.docId,
			name: component.dataQuery.link.name,
			alt: component.dataQuery.link.name,
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
