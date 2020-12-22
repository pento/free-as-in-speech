import { startExport } from './services';

browser.tabs.query( { active: true, currentWindow: true } ).then( ( tabs ) => {
	const currentTabUrl = tabs[ 0 ].url;

	if ( currentTabUrl.startsWith( 'https://www.wix.com/dashboard/' ) ) {
		document.body.classList.remove( 'generic-site' );
		document.body.classList.add( 'wix-site' );
	}
} );

document.addEventListener( 'DOMContentLoaded', () => {
	document
		.getElementById( 'wix-export' )
		.addEventListener( 'click', () => startExport( 'wix' ) );
} );
