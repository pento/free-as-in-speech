const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

/**
 * MusicPlayerData covers:
 * - Wix music
 * - Audio player
 */
module.exports = {
	type: 'MusicPlayerData',
	parseComponent: ( component, { metaData } ) => {
		Logger( 'wix' ).log( 'MusicPlayerData' );
		if ( ! component.dataQuery.audioRef ) {
			return null;
		}

		const uri = component.dataQuery.audioRef.uri;
		const prefix = metaData.serviceTopology.staticAudioUrl;

		const attrs = {
			src: prefix + '/' + uri,
		};

		if (
			component.propertyQuery &&
			component.propertyQuery.type === 'MusicPlayerProperties'
		) {
			Object.assign( attrs, {
				loop: component.propertyQuery.loop,
				autoplay: component.propertyQuery.autoplay,
			} );
		}

		return createBlock( 'core/audio', attrs );
	},
};
