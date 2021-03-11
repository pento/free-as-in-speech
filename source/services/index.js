const startWixExport = require( './wix' );

/**
 * Start the export for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 * @param {Object} config Any config data that needs to be passed to the exporter.
 * @param {Function} statusReport A callback to show a message in the popup.
 */
module.exports = ( service, config, statusReport ) => {
	if ( service === 'wix' ) {
		return startWixExport( config, statusReport );
	}
};
