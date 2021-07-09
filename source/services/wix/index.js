/**
 * WordPress dependencies
 */
const { getWXZDriver } = require( '@wordpress/wxz' );

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

	[ siteMetaSettings ].concat( extractors ).forEach( ( extractor ) => {
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

	if ( appDefinitionId === 'static-pages' ) {
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
	const wxz = await getWXZDriver( 1, true );

	const extractData = ( fallbackConfig ) => async ( extractor ) => {
		// Grab the config data for this extractor.
		let extractorConfig = getExtractorConfig(
			config,
			extractor.appDefinitionId
		);

		// If we couldn't find any app config for this extractor, the app isn't enabled.
		if ( ! extractorConfig ) {
			extractorConfig = fallbackConfig;
			if ( ! extractorConfig ) {
				return;
			}
		}
		statusReport( {
			id: extractor.appDefinitionId,
			state: 'in-progress',
		} );

		// Run the extractor.
		const extractedData = await extractor.extract( extractorConfig );

		// Convert the extracted data to WXZ.
		await extractor.save( extractedData, wxz );
		statusReport( {
			id: extractor.appDefinitionId,
			state: 'done',
		} );

		return extractedData;
	};

	// We need to extract the site meta first.
	const siteMeta = await extractData( { instance: null } )(
		siteMetaSettings
	);
	if ( siteMeta && siteMeta.quickActionsData ) {
		// Backfill the metadata when none available (e.g. in CLI).
		if ( ! config.initialState ) {
			config.initialState = {};
		}
		if ( ! config.initialState.siteMetaData ) {
			config.initialState.siteMetaData = {};
		}
		if ( ! config.initialState.siteMetaData.metaSiteId ) {
			config.initialState.siteMetaData.metaSiteId =
				siteMeta.quickActionsData.metaSiteId;
		}
	}

	await Promise.all(
		extractors.map( extractData( config.extractAll ? {} : null ) )
	);

	return wxz;
};

module.exports = {
	getInstalledApps,
	startExport,
};
