/**
 * Store the wix config in memory, so that it's available whenever it's needed.
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
		case 'get_wix_config':
			// Return the config data requested by other parts of the extension.
			return new Promise( ( resolve ) => resolve( wixConfig ) );
	}
} );
