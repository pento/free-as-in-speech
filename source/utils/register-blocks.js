/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
const { registerBlockType } = require( '@wordpress/blocks' );
require( '@wordpress/format-library' );

module.exports = {
	registerBlocks: () => {
		registerCoreBlocks();

		registerBlockType( 'core-import/plugin-placeholder', {
			title: 'Plugin Placeholder',
			attributes: {
				data: {
					type: 'string',
					default: null,
				},
			},
		} );
	},
};
