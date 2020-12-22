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

export const startExport = async () => {
	const config = await browser.runtime.sendMessage( {
		type: 'get_wix_config',
	} );

	const wxr = new WXR();

	extractors.forEach( async ( extractor ) => {
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
		const extractedData = await extractor.extract( extractorConfig );

		extractor.save( extractedData, wxr );

		const exportFile = new Blob( [ wxr.export() ], {
			type: 'text/xml',
		} );

		saveAs( exportFile, 'wix-export.wxr' );
	} );
};
