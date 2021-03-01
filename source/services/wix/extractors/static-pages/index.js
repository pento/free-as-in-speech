const { v4: uuidv4 } = require('uuid');

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
		const url = new URL(
			'https://manage.wix.com/editor/' + config.metaSiteId
		);
		url.searchParams.set( 'editorSessionId', uuidv4() );
		url.searchParams.set( 'referralInfo', 'my-account' );
		return await window
			.fetch( url, {
				credentials: 'include',
				referrer: 'https://manage.wix.com/dashboard/' + config.metaSiteId + '/home?referralInfo=my-sites',
				mode: 'same-origin',
				headers: {
			        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			        "Upgrade-Insecure-Requests": 1,
				}
			} )
			.then( ( result ) => result.text() )
	 	 	.then( ( html ) => {
		 		const $ = cheerio.load( html );
				$( 'script' ).each( ( idx, scriptTag ) => {
					const currentTag = $( scriptTag );
					console.log(currentTag.html())
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
