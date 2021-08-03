/**
 * WordPress dependencies
 */
if ( global.process ) {
	global.process.env = {
		...global.process.env,
		GUTENBERG_PHASE: 2, // This needs to be a integer, setting it directly would make it a string.
	};
}

if ( typeof global.CSS === 'undefined' ) {
	global.CSS = {
		supports() {},
		escape() {},
	};
}

const {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} = require( '@wordpress/block-library' );
const { registerBlockType } = require( '@wordpress/blocks' );
require( '@wordpress/format-library' );
let registered = false;

module.exports = {
	registerBlocks: () => {
		if ( registered ) {
			return;
		}
		registered = true;
		registerCoreBlocks();

		registerBlockType( 'core-import/plugin-placeholder', {
			title: 'Plugin Placeholder',
			attributes: {
				id: {
					type: 'int',
					default: null,
				},
			},
		} );

		if (
			typeof __experimentalRegisterExperimentalCoreBlocks === 'function'
		) {
			__experimentalRegisterExperimentalCoreBlocks();
		}
	},
};
