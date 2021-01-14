/**
 * WordPress dependencies
 */
import WXR from '@wordpress/wxr';

browser.pageAction.onClicked.addListener( () => {
	const exporter = new WXR();

	console.log( exporter.export() );
} );
