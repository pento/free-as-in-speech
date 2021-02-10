/**
 * Internal dependencies
 */
const { WXRDriver: WXR12Driver } = require( './1.2' );

const getWXRDriver = async ( WXRVersion ) => {
	let driver;

	switch ( WXRVersion ) {
		case '1.2':
			driver = new WXR12Driver();
	}

	await driver.connect();

	return driver;
};

module.exports = {
	getWXRDriver,
};
