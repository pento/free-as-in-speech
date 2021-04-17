/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
const { registerBlockType } = require( '@wordpress/blocks' );
require( '@wordpress/format-library' );

module.exports = {
	registerBlocks: () => {
		registerCoreBlocks();

		registerBlockType( 'jetpack/field-text', {
			title: 'Jetpack Text Field',
			attributes: {
				label: {
					type: 'string',
					default: null,
				},
			},
		} );
	},
};
