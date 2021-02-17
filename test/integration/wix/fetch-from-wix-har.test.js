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

test( 'wix-basic', () => {
	registerCoreBlocks();

	const inputHAR = fs.readFileSync(
		path.join( __dirname, 'fixtures/wix-basic.har' )
	);
	const outputWXR = fs.readFileSync(
		path.join( __dirname, 'fixtures/wix-basic.wxr' )
	);

	function stripFirstPubDate( wxr ) {
		return wxr
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
	).then( ( wxr ) =>
		expect( stripFirstPubDate( outputWXR ) ).toEqual(
			stripFirstPubDate( wxr )
		)
	);
} );
