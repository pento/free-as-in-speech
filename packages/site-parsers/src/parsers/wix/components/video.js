const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'VideoPlayer',
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'VideoPlayer' );

		if ( ! component.dataQuery.videoUrl ) {
			return null;
		}

		switch ( component.dataQuery.videoType.toUpperCase() ) {
			case 'VIMEO':
			case 'YOUTUBE':
			case 'FACEBOOK':
			case 'DAILYMOTION':
				return createBlock( 'core/embed', {
					url: component.dataQuery.videoUrl,
					providerNameSlug: component.dataQuery.videoType,
				} );

			default:
				return null;
		}
	},
};
