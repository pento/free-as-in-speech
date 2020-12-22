let wixAppConfig;

browser.runtime.onMessage.addListener( ( message ) => {
	switch ( message.type ) {
		case 'save_wix_config':
			wixAppConfig = message.data;
			break;
		case 'get_wix_config':
			return new Promise( ( resolve ) => resolve( wixAppConfig ) );
	}
} );
