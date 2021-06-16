const { createBlock } = require( '@wordpress/blocks' );
const { parseComponent: linkBarParseComponent } = require( './link-bar' );

const parseImages = ( images, metaData ) => {
	return images.map( ( img ) => {
		const prefix = metaData.serviceTopology.staticAudioUrl;

		const attrs = {
			id: img.id,
			alt: img.alt,
			title: img.title,
			caption: img.description,
			url: prefix + '/' + img.uri,
			fulUrl: '/' + prefix + '/' + img.uri,
		};

		if ( img.link ) {
			attrs.link = img.link.url;
		}

		return attrs;
	} );
};

module.exports = {
	type: 'ImageList',
	parseComponent: ( component, { metaData } ) => {
		const images = parseImages( component.dataQuery.items, metaData );
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
