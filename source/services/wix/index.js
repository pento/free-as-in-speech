/**
 * WordPress dependencies
 */
const { getWXRDriver } = require( '@wordpress/wxr' );

/**
 * Internal dependencies
 */
const extractors = require( './extractors' );
const siteMetaSettings = require( './extractors/site-meta-app' );

/**
 * Returns an array of the installed apps.
 *
 * @param {Object} config The Wix config data.
 * @return {Array} A list of the installed apps.
 */
const getInstalledApps = ( config ) => {
	const installed = [];

	extractors.forEach( ( extractor ) => {
		if ( getExtractorConfig( config, extractor.appDefinitionId ) ) {
			installed.push( {
				id: extractor.appDefinitionId,
				name: extractor.appName,
			} );
		}
	} );

	return installed;
};

/**
 * Return the config data for a given Wix app definition ID.
 *
 * @param {Object} config          The Wix config data.
 * @param {string} appDefinitionId The Wix app definition ID.
 * @return {*} The config data for the given app, or false if no config data can be found.
 */
const getExtractorConfig = ( config, appDefinitionId ) => {
	if ( appDefinitionId === 'media-manager' ) {
		return config.mediaToken;
	}

	if ( extractor.appDefinitionId === 'static-pages' ) {
		return {
			metaSiteId: config.initialState.siteMetaData.metaSiteId,
		};
	}

	return Object.values(
		( config.initialState && config.initialState.embeddedServices ) || {}
	).reduce( ( found, appConfig ) => {
		if ( found ) {
			return found;
		}

		if ( appConfig.appDefinitionId === appDefinitionId ) {
			return appConfig;
		}

		return false;
	}, false );
};

/**
 * Loop through all of the defined extractors, and run them over the content.
 *
 * @param {Object} config The Wix config data.
 * @param {Function} statusReport A callback to show a message in the popup.
 */
const startExport = async ( config, statusReport ) => {
	const wxr = await getWXRDriver( '1.2', true );

	// We'll need the meta data for some other extractors, so let's download it first.
	const siteMeta = await siteMetaSettings.extract( config );
	await siteMetaSettings.save( siteMeta, wxr );

	if ( siteMeta ) {
		if ( ! config.initialState ) {
			config.initialState = {};
		}
		if ( ! config.initialState.siteMetaData ) {
			config.initialState.siteMetaData = {};
		}
		if ( ! config.initialState.siteMetaData.metaSiteId ) {
			config.initialState.siteMetaData.metaSiteId = siteMeta.quickActionsData.metaSiteId;
		}
	}

	await Promise.all(
		extractors.map( async ( extractor ) => {
			// Grab the config data for this extractor.
			let extractorConfig = getExtractorConfig(
				config,
				extractor.appDefinitionId
			);

			// If we couldn't find any app config for this extractor, the app isn't enabled.
			if ( ! extractorConfig ) {
				if ( config.extractAll ) {
					extractorConfig = {};
				} else {
					return;
				}
			}
			statusReport( {
				id: extractor.appDefinitionId,
				state: 'in-progress',
			} );

			// Run the extractor.
			const extractedData = await extractor.extract( extractorConfig );

			// Convert the extracted data to WXR.
			await extractor.save( extractedData, wxr );
			statusReport( {
				id: extractor.appDefinitionId,
				state: 'done',
			} );
		} )
	);

	return wxr;
};

module.exports = {
	getInstalledApps,
	startExport,
};
