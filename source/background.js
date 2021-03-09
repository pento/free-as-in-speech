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

const downloadObjects = new Map();

/**
 * Listen for messages coming from other parts of the extension.
 */
browser.runtime.onMessage.addListener( async ( message ) => {
	switch ( message.type ) {
		case 'save_wix_config':
			// Save the config data sent from content.js.
			wixConfig = message.data;
			break;
		case 'get_wix_config':
			// Return the config data requested by other parts of the extension.
			return new Promise( ( resolve ) => resolve( wixConfig ) );
		case 'start_wix_export':
			// Start the export.
			const wxr = await startExport(
				'wix',
				wixConfig,
				( status ) =>
					browser.runtime.sendMessage( {
						type: 'export_progress_update',
						data: status,
					} )
			);
			
			// Present the export as a download.
			const url = URL.createObjectURL(
				new Blob( [ await wxr.export() ], { type: 'text/xml+wxr' } )
			);

			const id = await browser.downloads.download( {
				url,
				filename: 'wix-export.wxr',
			} );

			downloadObjects.set( id, url );

			break;
	}
} );

browser.downloads.onChanged.addListener( ( delta ) => {
	if ( delta.state && delta.state.current === 'complete' ) {
		if ( downloadObjects.has( delta.id ) ) {
			URL.revokeObjectURL( downloadObjects.get( delta.id ) );
			downloadObjects.delete( delta.id );
		}
	}
} );

// Register the Core WordPress block library, so we're able to export to those blocks.
registerCoreBlocks();
