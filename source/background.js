/**
 * Internal dependencies
 */
import { startExport } from './services';

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
		case 'start_wix_export':
			const exportData = await startExport( 'wix', wixConfig );

			browser.tabs.sendMessage( wixTabId, {
				type: 'generate_download',
				data: exportData,
			} );

			break;
	}
} );
