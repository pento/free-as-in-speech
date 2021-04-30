/**
 * Internal dependencies
 */
const { WXRDriver: WXR12Driver } = require( './1.2' );
const { WXRDriver: WXR13Driver } = require( './1.3' );

const SUPPORTED_VERSIONS = [ '1.2', '1.3' ];

const getWXRDriver = async ( wxrVersion, reset = false ) => {
	if ( ! SUPPORTED_VERSIONS.includes( wxrVersion ) ) {
		return;
	}

	let driver;

	switch ( wxrVersion ) {
		case '1.2':
			driver = new WXR12Driver();
			break;
		case '1.3':
			driver = new WXR13Driver();
			break;
	}

	await driver.connect( { reset } );

	return driver;
};

module.exports = {
	getWXRDriver,
	SUPPORTED_VERSIONS,
};
