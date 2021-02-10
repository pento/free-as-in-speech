/**
 * External dependencies
 */
const { WritableStream } = require( 'web-streams-polyfill/ponyfill/es6' );

/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
require( '@wordpress/format-library' );

/**
 * Internal dependencies
 */
const startExport = require( './services' );

/**
 * Store the wix config in memory, so that it's available whenever it's needed,
 * but will be lost when the background process dies.
 */
let wixConfig;

/**
 * Store which browser tab Wix is open in.
 */
let wixTabId;

/**
 * Listen for messages coming from other parts of the extension.
 */
browser.runtime.onMessage.addListener( async ( message, sender ) => {
	switch ( message.type ) {
		case 'save_wix_config':
			// Save the config data sent from content.js.
			wixConfig = message.data;
			wixTabId = sender.tab.id;
			break;
		case 'get_wix_config':
			// Return the config data requested by other parts of the extension.
			return new Promise( ( resolve ) => resolve( wixConfig ) );
		case 'start_wix_export':
			// Start the export.
			const wxr = await startExport( 'wix', wixConfig );

			await browser.tabs.sendMessage( wixTabId, {
				type: 'start_download',
			} );

			let buffer = '';

			const writableStream = new WritableStream( {
				write: ( chunk ) =>
					new Promise( ( resolve ) => {
						buffer += chunk;

						let data = '';
						if ( buffer.length > 1024 ) {
							data = buffer;
							buffer = '';
						}
						resolve();

						if ( data.length > 0 ) {
							browser.tabs.sendMessage( wixTabId, {
								type: 'download_data',
								data,
							} );
						}
					} ),
				close: () => {
					browser.tabs
						.sendMessage( wixTabId, {
							type: 'download_data',
							data: buffer,
						} )
						.then( () => {
							browser.tabs.sendMessage( wixTabId, {
								type: 'finish_download',
							} );
						} );
				},
			} );

			wxr.stream( writableStream );

			break;
	}
} );

// Register the Core WordPress block library, so we're able to export to those blocks.
registerCoreBlocks();
