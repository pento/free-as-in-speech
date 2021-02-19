/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
require( '@wordpress/format-library' );

/**
 * Internal dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( 'fetch-from-har' );
const getWXRFromWixHAR = require( '../../../bin/lib/get-wxr-from-wix-har' );
const wixServices = require( '../../../source/services/wix' );

registerCoreBlocks();

test.each( [
	[ 'empty.har', 'empty.wxr', true ],
	[ 'wix-basic.har', 'wix-basic.wxr', false ],
] )( 'wix: %s -> %s', async ( har, wxr, errorsExpected ) => {
	const inputHAR = fs.readFileSync( path.join( __dirname, 'fixtures', har ) );
	const outputWXR = fs.readFileSync(
		path.join( __dirname, 'fixtures', wxr )
	);

	function stripFirstPubDate( xml ) {
		return xml
			.toString()
			.replace( /<pubDate>[^<]+/, '<pubDate>' )
			.trim();
	}

	return getWXRFromWixHAR(
		fetchFromHAR,
		JSON.parse( inputHAR ),
		{
			initialState: {
				embeddedServices: {},
			},
			extractAll: true,
		},
		wixServices
	).then( ( xml ) => {
		expect( stripFirstPubDate( outputWXR ) ).toEqual(
			stripFirstPubDate( xml )
		);
		if ( errorsExpected ) {
			expect( console ).toHaveErrored();
		}
	} );
} );
