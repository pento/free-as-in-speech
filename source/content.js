/**
 * External dependencies
 */
import { saveAs } from 'file-saver';

// Listen for the message to save the config.
window.addEventListener( 'message', ( e ) => {
	switch ( e.data.type ) {
		case 'save_wix_config':
			browser.runtime.sendMessage( e.data );
			break;
	}
} );

// Listen for the message to create the download.
browser.runtime.onMessage.addListener( ( message ) => {
	switch ( message.type ) {
		case 'generate_download':
			const exportFile = new Blob( [ message.data ], {
				type: 'text/xml',
			} );

			saveAs( exportFile, 'wix-export.wxr' );
	}
} );

const code = `
( () => {
	let tries = 0;
	let realPostMessage;

	// window.__INITIAL_STATE__ is set when the page is loaded, but is subsequently deleted once
	// it's been loaded into Wix's redux store. In order to intercept it, we load this script as early
	// as we possibly can.
	//
	// As this script is loaded extremely early, it may be run before the window.__INITIAL_STATE__
	// object has been set. To allow for this, we can check every 5 ms, so we get it as soon as it's
	// defined.
	const intervalId = setInterval( () => {
		// If the state didn't become available in the first 500ms, it probably isn't there.
		// Kill this timer, since it would otherwise be a bit of a performance drag.
		if ( tries > 100 ) {
			clearInterval( intervalId );
			return;
		}

		if ( ! window ) {
			return;
		}

		// Grab a copy of window.postMessage as soon as it's available, to ensure we're using
		// an original version.
		if ( ! realPostMessage && window.postMessage ) {
			realPostMessage = window.postMessage;
		}

		tries++;

		if ( window.__INITIAL_STATE__ ) {
			// To communicate back to content.js, use window.postMessage().
			realPostMessage( {
				type: 'save_wix_config',
				data: window.__INITIAL_STATE__,
			}, '*' );

			clearInterval( intervalId )
		}
	}, 5 );
} )();
`;

// Add this script to the DOM, so it's executed in the context of the real page.
const script = document.createElement( 'script' );
script.textContent = code;
document.documentElement.appendChild( script );

// Remove the script from the DOM once we're done with it.
setTimeout( () => document.documentElement.removeChild( script ), 500 );
