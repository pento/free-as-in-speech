/**
 * WordPress dependencies
 */
import WXR from '@wordpress/wxr';

/**
 * Internal dependencies
 */
import { extractors } from './extractors';

/**
 * Loop through all of the defined extractors, and run them over the content.
 *
 * @param {Object} config The Wix config data.
 */
export const startExport = async ( config ) => {
	const wxr = new WXR();

	const { initialState, mediaToken } = config;

	await Promise.all(
		extractors.map( async ( extractor ) => {
			// Grab the config data for this extractor.
			let extractorConfig;

			if ( extractor.appId === 'media-manager' ) {
				extractorConfig = mediaToken;
			} else if ( extractor.appId === 'adi-editor' ) {
				if ( initialState.liveSite.editorType === 'ADI' ) {
					extractorConfig = initialState.siteMetaData;
				}
			} else {
				extractorConfig = Object.values(
					initialState.embeddedServices
				).reduce( ( found, appConfig ) => {
					if ( found ) {
						return found;
					}

					if ( appConfig.applicationId === extractor.appId ) {
						return appConfig;
					}

					return false;
				}, false );
			}

			// Run the extractor.
			const extractedData = await extractor.extract( extractorConfig );

			// Convert the extracted data to WXR.
			await extractor.save( extractedData, wxr );
		} )
	);

	return wxr.export();
};
