/**
 * Check if the current tab is the Wix dashboard. If it is, update the popup body classes accordingly.
 */
browser.tabs.query( { active: true, currentWindow: true } ).then( ( tabs ) => {
	const currentTabUrl = tabs[ 0 ].url;

	if ( currentTabUrl.startsWith( 'https://www.wix.com/dashboard/' ) ) {
		document.body.classList.remove( 'generic-site' );
		document.body.classList.add( 'wix-site' );
	}
} );

/**
 * Event listener for when the Wix Export button is clicked in the popup.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	document.getElementById( 'wix-export' ).addEventListener( 'click', () =>
		browser.runtime.sendMessage( {
			type: 'start_wix_export',
		} )
	);
} );
