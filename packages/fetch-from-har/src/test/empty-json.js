const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( '../index' );

test.each( [
	[ 'empty-json.har', { url: 'https://not-in-har/', result: undefined } ],
] )( '%s', async ( harFile, testData ) => {
	const har = JSON.parse(
		fs.readFileSync( path.join( __dirname, harFile ) )
	);
	return fetchFromHAR( har )( testData.url )
		.then( ( result ) => result.json() )
		.then(
			( result ) => {
				expect( result ).toEqual( testData.result );
			},
			() => expect( undefined ).toEqual( testData.result )
		);
} );
