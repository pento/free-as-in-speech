const { parseComponent: parseSpotify } = require( './spotify' );
const { parseComponent: parseSoundCloud } = require( './sound-cloud' );

const APP_ID = {
	SPOTIFY: '2575',
	SPOTIFY2: '4909',
	WIX_MUSIC: '1662',
	SOUND_CLOUD: '3195',
};

module.exports = {
	type: 'TPAWidget',
	// eslint-disable-next-line
	parseComponent: function ( component ) {
		switch ( component.dataQuery.applicationId ) {
			case APP_ID.SPOTIFY:
			case APP_ID.SPOTIFY2:
				return parseSpotify( ...arguments );
			case APP_ID.SOUND_CLOUD:
				return parseSoundCloud( ...arguments );
			case APP_ID.WIX_MUSIC:
			default:
				break;
		}
	},
};
