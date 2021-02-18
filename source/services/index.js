const startWixExport = require( './wix' );

/**
 * Start the export for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 * @param {Object} config Any config data that needs to be passed to the exporter.
 */
module.exports = ( service, config ) => {
	if ( service === 'wix' ) {
		return startWixExport( config );
	}
};
