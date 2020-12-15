/**
 * External dependencies
 */
import { saveAs } from 'file-saver';

/**
 * WordPress dependencies
 */
import WXR from '@wordpress/wxr';

const wixAppConfig = new Map();

browser.tabs.onActivated.addListener( ( tabs ) =>
	browser.pageAction.show( tabs.tabId )
);

browser.pageAction.onClicked.addListener( () => {
	const config = wixAppConfig.get( 'communities-blog-app' );

	if ( ! config || ! config.instance ) {
		// eslint-disable-next-line no-console
		console.log( 'No instanceid available.' );
		return;
	}

	window
		.fetch(
			'https://www.wix.com/_api/communities-blog-node-api/_api/posts?offset=0&size=10&fieldsets=categories,owner,likes,content,subscriptions,tags',
			{ headers: { instance: config.instance } }
		)
		.then( async ( result ) => {
			const data = await result.json();
			const wxrData = new WXR();

			wxrData.addAuthor( {
				login: 'pento',
				email: 'gary@pento.net',
			} );

			data.forEach( ( post ) => {
				const content = post.content.blocks
					.map( ( block ) => {
						switch ( block.type ) {
							case 'unstyled':
								return `<p>${ block.text }</p>`;
						}
						return false;
					} )
					.filter( ( blockContent ) => blockContent !== false )
					.join( '\n\n' );

				wxrData.addPost( {
					title: post.title,
					contentEncoded: content,
					author: 'pento',
				} );
			} );

			const exportFile = new Blob( [ wxrData.export() ], {
				type: 'text/xml',
			} );

			saveAs( exportFile, 'wix-export.wxr' );
		} );
} );

browser.runtime.onMessage.addListener( ( data ) => {
	wixAppConfig.set( data.data.app, {
		instance: data.data.instance,
	} );
} );
