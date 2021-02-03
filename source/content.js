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
	let initialState = null, mediaToken = null, sentMessage = false;
	let lastInitialState = null, lastMediaToken = null;

	function sendMessage() {
		if ( ! initialState ) return;
		if ( ! mediaToken ) return;
		if ( sentMessage ) return;
		sentMessage = true;
		window.postMessage( {
			type: 'save_wix_config',
			data: { initialState, mediaToken },
		}, '*' );

	}

	// window.__INITIAL_STATE__ is set when the page is loaded, but is subsequently deleted once
	// it's been loaded into Wix's redux store. In order to keep a copy before this happens, we intercept
	// it right when the value is being set.

	Object.defineProperty( window, '__INITIAL_STATE__', {
		configurable: true, // Needs to be true so that it can be deleted later.
		get: function() {
			return lastInitialState;
		},
		set: function( value ) {
			if ( ! initialState ) {
				initialState = Object.assign( {}, value );
				sendMessage();
			}
			return lastInitialState = value;
		}
	} );

	Object.defineProperty(window, '__MEDIA_TOKEN__', {
		configurable: true, // Needs to be true so that it can be deleted later.
		get: function() {
			return lastMediaToken;
		},
		set: function( value ) {
			if ( ! mediaToken ) {
				mediaToken = value;
				sendMessage();
			}
			return lastMediaToken = value;
		}
	} );

} )();
`;

// Add this script to the DOM, so it's executed in the context of the real page.
const script = document.createElement( 'script' );
script.textContent = code;
document.documentElement.appendChild( script );

// Remove the script from the DOM once we're done with it.
setTimeout( () => document.documentElement.removeChild( script ), 500 );
