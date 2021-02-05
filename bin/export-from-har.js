const windowPolyFill = require('node-window-polyfill');
windowPolyFill.register();
window.URL = URL;
const fs = require( 'fs' );
const fetchFromHAR = require( 'fetch-from-har' );

const services = require( '../source/services' );
const mockMapping = {
	"manage.wix.com": {
		"/_api/communities-blog-node-api/_api/posts": {
			"status": true
		}
	}
};

const filename = process.argv[2];
global.fetch = fetchFromHAR(
	JSON.parse( fs.readFileSync( filename ) ),
	{
		queryComparison: ( requestValue, harValue, key, url ) => {
			if ( requestValue === harValue ) {
				return true;
			}
			if ( 'undefined' !== typeof mockMapping[ url.host ][ url.pathname ][ key ] ) {
				return mockMapping[ url.host ][ url.pathname ][ key ];
			}
			return false;
		}
	}
);
window.fetch = global.fetch;

const wxr = services.startExport( 'wix', {
	mediaToken: 'test',
	initialState: {
		embeddedServices:[
			{
				applicationId: 10297
			}
		]
	}
} );
console.log( wxr );
