import { startExport as startWixExport } from './wix';

/**
 * Start the export for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 * @param {Object} config Any config data that needs to be passed to the exporter.
 */
export const startExport = ( service, config ) => {
	if ( service === 'wix' ) {
		return startWixExport( config );
	}
};
