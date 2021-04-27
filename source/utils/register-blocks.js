/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
require( '@wordpress/format-library' );

module.exports = {
	registerBlocks: () => {
		registerCoreBlocks();
	},
};
