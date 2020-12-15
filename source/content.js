window.addEventListener( 'message', ( e ) => {
	switch ( e.data.message ) {
		case 'intercepted_fetch':
			// eslint-disable-next-line no-console
			console.log(
				'Received blog request data, relaying to the background script.'
			);
			browser.runtime.sendMessage( e.data );
			break;
	}
} );

const code = `
( () => {
	const { fetch: originalFetch } = window;
	let sent = false;
	window.fetch = async ( ...arguments ) => {
		if ( ! sent && arguments[0].startsWith( '/_api/communities-blog-node-api/_api/posts' ) ) {
			console.log( 'Found a blog request, relaying data to the extension.' );

			window.postMessage( {
				message: 'intercepted_fetch',
				data: {
					app: 'communities-blog-app',
					instance: arguments[1].headers.instance,
				},
			}, '*' );

			sent = true;
		}
		const response = await originalFetch( ...arguments );

		return response;
	};
} )();
`;

const script = document.createElement( 'script' );
script.textContent = code;
document.documentElement.appendChild( script );
