/**
 * WordPress dependencies
 */
global.process.env = {
	...global.process.env,
	GUTENBERG_PHASE: 2, // This needs to be a integer, setting it directly would make it a string.
};

const {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} = require( '@wordpress/block-library' );
const { registerBlockType } = require( '@wordpress/blocks' );
require( '@wordpress/format-library' );

module.exports = {
	registerBlocks: () => {
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
		__experimentalRegisterExperimentalCoreBlocks();
	},
};
