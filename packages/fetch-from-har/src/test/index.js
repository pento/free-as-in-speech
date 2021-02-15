const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( '../index' );

const har = JSON.parse( fs.readFileSync( path.join( __dirname, 'test.har' ) ) );
test.each( [
	{ url: 'https://localhost/', result: { hello: 'world' } },
	{ url: 'https://localhost/?hello=earth', result: { hello: 'earth' } },
	{ url: 'https://not-in-har/', result: undefined },
] )( 'Basic HAR file', async ( testData ) => {
	return fetchFromHAR( har )( testData.url )
		.then( ( result ) => result.json() )
		.then(
			( result ) => {
				expect( result ).toEqual( testData.result );
			},
			() => expect( undefined ).toEqual( testData.result )
		);
} );

test.each( [
	{
		url: 'https://localhost/test',
		result: { hello: 'test' },
		fallback: { 'https://localhost/test': '{"hello":"test"}' },
	},
] )( 'Fallback', async ( testData ) => {
	return fetchFromHAR( har, {
		fallback: ( url, entry ) => {
			if ( testData.fallback[ url ] !== undefined ) {
				entry.response.status = 200;
				entry.response.statusText = 'OK';
				entry.response.content.text = testData.fallback[ url ];
			}

			return entry;
		},
	} )( testData.url )
		.then( ( result ) => result.json() )
		.then( ( result ) => {
			expect( result ).toEqual( testData.result );
		} );
} );

test.each( [
	{
		url: 'https://localhost/?hello=something',
		result: { hello: 'world' },
		mockMapping: {}, // mismatching query strings are ignored.
	},
	{
		url: 'https://localhost/?hello=something',
		result: { hello: 'world' },
		mockMapping: {
			localhost: {
				'/': {
					hello: false, // parameter values don't need to match.
				},
			},
		},
	},
	{
		url: 'https://localhost/?hello=earth',
		result: { hello: 'earth' },
		mockMapping: {
			localhost: {
				'/': {
					hello: true, // parameter values must match.
				},
			},
		},
	},
] )( 'Query Comparison', async ( testData ) => {
	return fetchFromHAR( har, {
		queryComparison: ( requestValue, harValue, key, url ) => {
			if (
				testData.mockMapping &&
				testData.mockMapping[ url.host ] &&
				testData.mockMapping[ url.host ][ url.pathname ][ key ]
			) {
				if (
					testData.mockMapping[ url.host ][ url.pathname ][ key ] &&
					requestValue !== harValue
				) {
					// The values must match, so this is not ok.
					return false;
				}
			}

			return true;
		},
	} )( testData.url )
		.then( ( result ) => result.json() )
		.then( ( result ) => {
			expect( result ).toEqual( testData.result );
		} );
} );
