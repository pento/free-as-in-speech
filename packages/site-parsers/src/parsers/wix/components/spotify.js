const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

const getSpotifyUrlFromUri = ( uri ) => {
	const uriRgx = /^spotify:(?<type>track|user|artist|album|playlist):(?<id>[a-zA-Z0-9]+)$/;
	if ( ! uriRgx.test( uri ) ) return uri;

	const uriMatch = uri.match( uriRgx );
	return `https://open.spotify.com/${ uriMatch.groups.type }/${ uriMatch.groups.id }`;
};

module.exports = {
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'Spotify' );

		const tpaData = component.dataQuery.tpaData;

		if ( typeof tpaData === 'object' && tpaData !== null ) {
			const content = JSON.parse( tpaData.content );

			return createBlock( 'core/embed', {
				url: getSpotifyUrlFromUri( content.spotifyURI ),
			} );
		}
	},
};
