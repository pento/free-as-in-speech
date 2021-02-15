const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( 'fetch-from-har' );
const getWXRFromWixHAR = require( '../../../bin/lib/get-wxr-from-wix-har' );
const wixServices = require( '../../../source/services/wix' );

test( 'wix-basic', () => {
	const inputHAR = fs.readFileSync(
		path.join( __dirname, 'fixtures/wix-basic.har' )
	);
	const outputWXR = fs.readFileSync(
		path.join( __dirname, 'fixtures/wix-basic.wxr' )
	);

	return getWXRFromWixHAR(
		fetchFromHAR,
		JSON.parse( inputHAR ),
		{
			initialState: {},
			extractAll: true,
		},
		wixServices
	).then( ( wxr ) => expect( wxr ).toEqual( outputWXR ) );
} );
