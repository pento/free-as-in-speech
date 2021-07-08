const { createBlock } = require( '@wordpress/blocks' );
const { parseComponent: linkBarParseComponent } = require( './link-bar' );

const parseImages = ( images, { addMediaAttachment } ) => {
	return images.map( ( img ) => {
		const attachment = addMediaAttachment( img );

		const attrs = {
			id: attachment.id,
			alt: img.alt,
			title: img.title,
			caption: img.description,
			url: attachment.attachment_url,
			fulUrl: attachment.attachment_url,
		};

		if ( img.link ) {
			attrs.link = img.link.url;
		}

		return attrs;
	} );
};

module.exports = {
	type: 'ImageList',
	parseComponent: ( component, meta ) => {
		const images = parseImages( component.dataQuery.items, meta );
		const attrs = {
			images,
			ids: images.map( ( img ) => img.id ),
		};

		switch ( component.propertyQuery.type ) {
			// Gallery: 3DCarousel, 3DCarousel, Slider Galleries
			case 'FreestyleProperties':
			case 'SlideShowGalleryProperties':
				return createBlock( 'core/gallery', attrs );

			// Gallery: Grid
			case 'MasonryProperties':
			case 'HoneycombProperties':
			case 'MatrixGalleryProperties':
			case 'PaginatedGridGalleryProperties':
				attrs.columns = component.propertyQuery.numCols || 3;
				return createBlock( 'core/gallery', attrs );

			// Gallery: Currently unsupported
			case 'ImpressProperties':
				break;

			case 'LinkBarProperties':
				return linkBarParseComponent( component );
		}
	},
};
