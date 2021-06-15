const { createBlock } = require( '@wordpress/blocks' );

const getVideoEmbedUrl = ( settings ) => {
	switch ( settings.videoType ) {
		case 'YOUTUBE':
			return `https://www.youtube.com/watch?v=${ settings.videoId }`;
		case 'VIMEO':
			return `https://player.vimeo.com/video/${ settings.videoId }`;
		case 'DAILYMOTION':
			return `https://www.dailymotion.com/embed/video/${ settings.videoId }`;
		case 'FACEBOOK':
			return `https://www.facebook.com/${ settings.videoId }`;
		default:
			return '';
	}
};

module.exports = {
	type: 'Video',
	parseComponent: ( component ) => {
		const attrs = {
			src: getVideoEmbedUrl( component.dataQuery ),
		};

		if (
			component.propertyQuery &&
			component.propertyQuery.type === 'VideoProperties'
		) {
			Object.assign( attrs, {
				loop: component.propertyQuery.loop,
				autoplay: component.propertyQuery.autoplay,
				controls:
					component.propertyQuery.showControls !== 'always_hide',
			} );
		}

		return createBlock( 'core/video', attrs );
	},
};
