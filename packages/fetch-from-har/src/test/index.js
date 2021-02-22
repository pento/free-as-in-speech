const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( '../index' );

test.each( [
	[ 'test.har', 'https://localhost/', { hello: 'world' } ],
	[ 'test.har', 'https://localhost/?hello=earth', { hello: 'earth' } ],
	[ 'test.har', 'https://not-in-har/', undefined ],
	[ 'empty-json.har', 'https://not-in-har/', undefined ],
] )( '%s -> %s', async ( harFile, testUrl, expected ) => {
	const har = JSON.parse(
		fs.readFileSync( path.join( __dirname, harFile ) )
	);
	return fetchFromHAR( har )( testUrl )
		.then( ( result ) => result.json() )
		.then(
			( result ) => {
				expect( result ).toEqual( expected );
			},
			() => expect( undefined ).toEqual( expected )
		);
} );

test.each( [
	[
		'https://localhost/test',
		{ 'https://localhost/test': '{"hello":"test"}' },
		{ hello: 'test' },
	],
] )( 'Fallback test: %s', async ( testUrl, fallback, expected ) => {
	const har = JSON.parse(
		fs.readFileSync( path.join( __dirname, 'test.har' ) )
	);

	return fetchFromHAR( har, {
		fallback: ( url, entry ) => {
			if ( fallback[ url ] !== undefined ) {
				entry.response.status = 200;
				entry.response.statusText = 'OK';
				entry.response.content.text = fallback[ url ];
			}

			return entry;
		},
	} )( testUrl )
		.then( ( result ) => result.json() )
		.then( ( result ) => {
			expect( result ).toEqual( expected );
		} );
} );

test.each( [
	[
		'https://localhost/?hello=something',
		{}, // mismatching query strings are ignored.
		{ hello: 'world' },
	],
	[
		'https://localhost/?hello=something',

		{
			localhost: {
				'/': {
					hello: false, // parameter values don't need to match.
				},
			},
		},
		{ hello: 'world' },
	],
	[
		'https://localhost/?hello=earth',
		{
			localhost: {
				'/': {
					hello: true, // parameter values must match.
				},
			},
		},
		{ hello: 'earth' },
	],
] )( 'Query Comparison: %s', async ( testUrl, mockMapping, expected ) => {
	const har = JSON.parse(
		fs.readFileSync( path.join( __dirname, 'test.har' ) )
	);

	return fetchFromHAR( har, {
		queryComparison: ( requestValue, harValue, key, url ) => {
			if (
				mockMapping &&
				mockMapping[ url.host ] &&
				mockMapping[ url.host ][ url.pathname ][ key ]
			) {
				if (
					mockMapping[ url.host ][ url.pathname ][ key ] &&
					requestValue !== harValue
				) {
					// The values must match, so this is not ok.
					return false;
				}
			}

			return true;
		},
	} )( testUrl )
		.then( ( result ) => result.json() )
		.then( ( result ) => {
			expect( result ).toEqual( expected );
		} );
} );
