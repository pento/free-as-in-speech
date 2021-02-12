const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( '../index' );

test( 'Basic HAR file', async () => {
	return fetchFromHAR(
		JSON.parse( fs.readFileSync( path.join( __dirname, 'test.har' ) ) )
	)( 'https://localhost/' )
		.then( ( result ) => result.json() )
		.then( ( result ) => {
			expect( result ).toEqual( { hello: 'world' } );
		} );
} );
