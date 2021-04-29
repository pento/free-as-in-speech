/**
 * Internal dependencies
 */
const { WXRDriver: WXR12Driver } = require( './1.2' );
const schema12 = require( './1.2/schema' );
const { WXRDriver: WXR13Driver } = require( './1.3' );
const schema13 = require( './1.3/schema' );

const SUPPORTED_VERSIONS = [ '1.2', '1.3' ];

const getWXRDriver = async ( wxrVersion, reset = false ) => {
	if ( ! SUPPORTED_VERSIONS.includes( wxrVersion ) ) {
		return;
	}

	let driver;

	switch ( wxrVersion ) {
		case '1.2':
			driver = new WXR12Driver( schema12 );
			break;
		case '1.3':
			driver = new WXR13Driver( schema13 );
			break;
	}

	await driver.connect( { reset } );

	return driver;
};

module.exports = {
	getWXRDriver,
	SUPPORTED_VERSIONS,
};
