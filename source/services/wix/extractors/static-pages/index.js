const cheerio = require( 'cheerio' );

const metaConfigurations = {};

module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	 appDefinitionId: 'static-pages',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	 extract: async ( config ) => {
	 	return await window
	 	.fetch( config.viewUrl, {
	 		credentials: 'include',
	 	} )
	 	.then( ( result ) => result.text() )
	 	.then( ( html ) => {
	 		const $ = cheerio.load( html );
			$( 'script' ).each( ( idx, scriptTag ) => {
				const currentTag = $( scriptTag );

				if ( currentTag.attr( 'id' ) === 'wix-viewer-model' ) {
					metaConfigurations.publicModel = JSON.parse( currentTag.html() );
					return;
				}

				if ( currentTag.attr( 'src' ) !== undefined ) {
					return;
				}

				const scriptBody = currentTag.html();
				const metaConfigurationRegExp = /(warmupData|serviceTopology|rendererModel|publicModel)\s*=\s*(\{.*\});\s*(?:var|$)/g;

				let match;
				while ( ( match = metaConfigurationRegExp.exec( scriptBody ) ) ) {
					const metaName = match[ 1 ];
					const metaConfigRawJSON = match[ 2 ];

					metaConfigurations[ metaName ] = JSON.parse( metaConfigRawJSON );
				}
			} );

			console.log(metaConfigurations.publicModel.siteAssets.siteScopeParams.pageJsonFileNames.masterPage)
	 		return metaConfigurations;
	 	} );
	 },

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	 save: async ( data, wxr ) => {
	 },
	};
