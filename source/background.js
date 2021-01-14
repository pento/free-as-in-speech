/**
 * WordPress dependencies
 */
import WXR from '@wordpress/wxr';

browser.pageAction.onClicked.addListener( () => {
	const exporter = new WXR();

	// eslint-disable-next-line no-console
	console.log( exporter.export() );
} );
