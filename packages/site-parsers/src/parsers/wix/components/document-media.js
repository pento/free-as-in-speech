const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

/**
 * The parent component handler is ./image.js
 * componentType: DocumentMedia
 */
module.exports = {
	parseComponent: ( component, { metaData, addMediaAttachment } ) => {
		Logger( 'wix' ).log( 'DocumentMedia' );

		if ( ! component.dataQuery.link ) {
			return null;
		}

		const attachment = addMediaAttachment(
			metaData.serviceTopology.staticHTMLComponentUrl,
			{
				uri: component.dataQuery.link.docId,
				name: component.dataQuery.link.name,
				alt: component.dataQuery.link.name,
			}
		);

		return createBlock( 'core/file', {
			id: attachment.id,
			href: attachment.link,
			fileName: attachment.name,
			textLinkHref: attachment.title,
			downloadButtonText: attachment.name,
		} );
	},
};
