/**
 * External dependencies
 */
const { WXRDriver: WXR12Driver } = require( '../1.2' );

/**
 * WXR version 1.3 driver.
 */
class WXRDriver extends WXR12Driver {
	/**
	 * Add an object to the export.
	 *
	 * @param {Object} object The object object.
	 */
	addObject( object ) {
		this.storeData( 'objects', object );
	}
}

module.exports = {
	WXRDriver,
};
