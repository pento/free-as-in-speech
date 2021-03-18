const {
	startExport: startWixExport,
	getInstalledApps: getInstalledWixApps,
} = require( './wix' );

/**
 * Start the export for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 * @param {Object} config Any config data that needs to be passed to the exporter.
 * @param {Function} statusReport A callback to show a message in the popup.
 */
const startExport = ( service, config, statusReport ) => {
	if ( service === 'wix' ) {
		return startWixExport( config, statusReport );
	}
};

/**
 * Get a list of the installed apps/plugins/etc for the given service.
 *
 * @param {string} service The service name. 'wix' is the only valid value at this time.
 * @param {Object} config Any config data that needs to be passed to the exporter.
 * @return {Array} The instapped apps.
 */
const getInstalledApps = ( service, config ) => {
	if ( service === 'wix' ) {
		return getInstalledWixApps( config );
	}
};

module.exports = {
	startExport,
	getInstalledApps,
};
