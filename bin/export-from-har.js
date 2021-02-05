// Some Gutenberg modules we use assume that there is a window.
const noop = function () {};

// eslint-disable-next-line no-undef
Mousetrap = {
	init: noop,
	prototype: {},
};
document = {
	addEventListener: noop,
	querySelectorAll: () => [],
	head: { appendChild: noop },
	createElement: () => {
		return {
			setAttribute: () => null,
			insertBefore: () => null,
			appendChild: () => null,
		};
	},
	createTextNode: () => {
		return {
			setAttribute: () => null,
		};
	},
};
document.head = document.createElement();
document.documentElement = document.createElement();
navigator = {}; // eslint-disable-line no-undef
window = {
	addEventListener: noop,
	matchMedia: () => ( {
		addListener: () => {},
	} ),
	navigator: { platform: '', userAgent: '' },
	Node: {
		TEXT_NODE: '',
		ELEMENT_NODE: '',
		DOCUMENT_POSITION_PRECEDING: '',
		DOCUMENT_POSITION_FOLLOWING: '',
	},
	URL,
};

const { registerBlockType } = require( '@wordpress/blocks' );
[
	// 'core/bold',
	require( '../node_modules/@wordpress/block-library/build/code/index.js' ),
	require( '../node_modules/@wordpress/block-library/build/embed/index.js' ),
	// 'core/file',
	// 'core/gallery',
	// 'core/heading',
	// 'core/image',
	// 'core/italic',
	// 'core/link',
	// 'core/list',
	require( '../node_modules/@wordpress/block-library/build/paragraph/index.js' ),
	require( '../node_modules/@wordpress/block-library/build/quote/index.js' ),
	// 'core/underline',
	// 'core/video',
].forEach( ( t ) => registerBlockType( t.name, t.settings ) );

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
		entry.response.content.text = '[]';
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
					// applicationId: -666,
				},
				{
					applicationId: 10297,
				},
			],
		},
	} );
}
getWxr().then( ( wxr ) => console.log( wxr ) ); // eslint-disable-line no-console
