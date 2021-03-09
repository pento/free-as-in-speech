/**
 * Check if the current tab is the Wix dashboard. If it is, update the popup body classes accordingly.
 */
browser.tabs
	.query( { active: true, currentWindow: true } )
	.then( async ( tabs ) => {
		const currentTabUrl = tabs[ 0 ].url;

		if ( currentTabUrl.startsWith( 'https://manage.wix.com/dashboard/' ) ) {
			// Get the config that's stored in the background.js process.
			const config = await browser.runtime.sendMessage( {
				type: 'get_wix_config',
			} );

			document.body.classList.remove( 'generic-site' );
			if ( config ) {
				document.body.classList.add( 'wix-site' );
			} else {
				document.body.classList.add( 'wix-site-no-config' );
			}
		}
	} );

browser.runtime.onMessage.addListener( ( message ) => {
	switch ( message.type ) {
		case 'export_progress_update':
			document.getElementById( 'wix-current-export-status' ).innerHTML =
				message.data;
			break;
	}
} );

/**
 * Event listener for when the Wix Export button is clicked in the popup.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	document.getElementById( 'wix-export' ).addEventListener( 'click', () => {
		document.body.classList.remove( 'wix-site' );
		document.body.classList.add( 'wix-export-in-progress' );
		browser.runtime.sendMessage( {
			type: 'start_wix_export',
		} );
	} );
} );
