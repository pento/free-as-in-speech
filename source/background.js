import { startExport } from './services';

/**
 * Store the wix config in memory, so that it's available whenever it's needed,
 * but will be lost when the background process dies.
 */
let wixConfig;

/**
 * Listen for messages coming from other parts of the extension.
 */
browser.runtime.onMessage.addListener( ( message ) => {
	switch ( message.type ) {
		case 'save_wix_config':
			// Save the config data sent from content.js.
			wixConfig = message.data;
			break;
		case 'start_wix_export':
			startExport( 'wix', wixConfig );
			break;
	}
} );
