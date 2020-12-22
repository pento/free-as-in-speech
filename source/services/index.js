import { startExport as startWixExport } from './wix';

/**
 * Start the export for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 */
export const startExport = ( service ) => {
	if ( service === 'wix' ) {
		startWixExport();
	}
};
