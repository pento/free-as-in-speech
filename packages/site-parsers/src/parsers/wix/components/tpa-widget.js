const { parseComponent: parseSpotify } = require( './spotify' );

const APP_ID = {
	SPOTIFY: '2575',
	WIX_MUSIC: '1662',
	SOUND_CLOUD: '3195',
};

module.exports = {
	type: 'TPAWidget',
	parseComponent: ( component ) => {
		switch ( component.dataQuery.applicationId ) {
			case APP_ID.SPOTIFY:
				return parseSpotify( component );
			case APP_ID.WIX_MUSIC:
			case APP_ID.SOUND_CLOUD:
			default:
				break;
		}
	},
};
