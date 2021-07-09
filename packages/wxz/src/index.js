/**
 * Internal dependencies
 */
const { WXZDriver: WXZ1Driver } = require( './1/index.js' );

const SUPPORTED_VERSIONS = [ 1 ];

const getWXZDriver = async ( wxzVersion, reset = false ) => {
	if ( ! SUPPORTED_VERSIONS.includes( wxzVersion ) ) {
		return;
	}

	let driver;

	switch ( wxzVersion ) {
		case 1:
			driver = new WXZ1Driver();
			break;
	}

	await driver.connect( { reset } );

	return driver;
};

module.exports = {
	getWXZDriver,
	SUPPORTED_VERSIONS,
};
