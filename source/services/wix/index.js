/**
 * External dependencies
 */
import { saveAs } from 'file-saver';

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

	extractors.forEach( async ( extractor ) => {
		// Grab the config data for this extractor.
		const extractorConfig = Object.values( config.embeddedServices ).reduce(
			( found, appConfig ) => {
				if ( found ) {
					return found;
				}

				if ( appConfig.applicationId === extractor.appId ) {
					return appConfig;
				}

				return false;
			},
			false
		);

		// Run the extractor.
		const extractedData = await extractor.extract( extractorConfig );

		// Convert the extracted data to WXR.
		await extractor.save( extractedData, wxr );

		const exportFile = new Blob( [ wxr.export() ], {
			type: 'text/xml',
		} );

		saveAs( exportFile, 'wix-export.wxr' );
	} );
};
