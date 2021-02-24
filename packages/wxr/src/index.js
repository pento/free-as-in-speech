/**
 * Internal dependencies
 */
const { WXRDriver: WXR12Driver } = require( './1.2' );

const SUPPORTED_VERSIONS = [ '1.2' ];

const getWXRDriver = async ( wxrVersion ) => {
	if ( ! SUPPORTED_VERSIONS.includes( wxrVersion ) ) {
		return;
	}

	let driver;

	switch ( wxrVersion ) {
		case '1.2':
			driver = new WXR12Driver();
	}

	await driver.connect();

	return driver;
};

module.exports = {
	getWXRDriver,
	SUPPORTED_VERSIONS,
};
