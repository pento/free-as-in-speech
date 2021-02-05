// Some Gutenberg modules we use assume that there is a window.
const windowPolyFill = require( 'node-window-polyfill' );
windowPolyFill.register();
window.URL = URL;

const fs = require( 'fs' );
const fetchFromHAR = require( 'fetch-from-har' );

const services = require( '../source/services' );
const mockMapping = {
	'manage.wix.com': {
		'/_api/communities-blog-node-api/_api/posts': {
			status: true,
		},
	},
};

// TODO: Implement proper argument parsing
const filename = process.argv[ 2 ];

window.fetch = fetchFromHAR( JSON.parse( fs.readFileSync( filename ) ), {
	queryComparison: ( requestValue, harValue, key, url ) => {
		if ( requestValue === harValue ) {
			return true;
		}
		if (
			'undefined' !==
			typeof mockMapping[ url.host ][ url.pathname ][ key ]
		) {
			return mockMapping[ url.host ][ url.pathname ][ key ];
		}
		return false;
	},
	fallback: ( url, entry ) => {
		console.log( 'Not Found', url ); // eslint-disable-line no-console
		const u = new URL( url );
		entry.response.content.text = '{}';
		// an example of how to hard-code a fallback, this will only be used if the HAR doesn't have such an entry.
		if ( u.pathname === '/_api/communities-blog-node-api/v2/tags/query' ) {
			entry.response.status = 200;
			entry.response.statusText = 'OK';
			entry.response.content.text = '{"tags":[]}';
		}
		return entry;
	},
} );

async function getWxr() {
	return await services.startExport( 'wix', {
		// mediaToken: 'test',
		initialState: {
			embeddedServices: [
				{
					applicationId: -666,
				},
			],
		},
	} );
}
getWxr().then( ( wxr ) => console.log( wxr ) ); // eslint-disable-line no-console
