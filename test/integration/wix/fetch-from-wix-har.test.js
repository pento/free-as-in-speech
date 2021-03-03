/**
 * WordPress dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );
const { registerCoreBlocks } = require( '@wordpress/block-library' );
require( '@wordpress/format-library' );

/**
 * Internal dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const fetchFromHAR = require( 'fetch-from-har' );
const getWXRFromWixHAR = require( '../../../bin/lib/get-wxr-from-wix-har' );
const { startExport } = require( '../../../source/services/wix' );

registerCoreBlocks();

beforeEach( () => {
	window.indexedDB = new FDBFactory();
} );

test.each( [
	[
		'empty.har',
		{
			initialState: {
				embeddedServices: {},
			},
			extractAll: true,
		},
		true,
		false,
	],
	[
		'wix-basic.har',
		{
			initialState: {
				embeddedServices: [
					'14bcded7-0066-7c35-14d7-466cb3f09103',
					'media-manager',
					'22bef345-3c5b-4c18-b782-74d4085112ff',
				].map( ( appDefinitionId ) => {
					return { appDefinitionId };
				} ),
			},
		},
		true,
		false,
	],
	[
		'easyblog.har',
		{
			initialState: {
				embeddedServices: [
					'13d7e48f-0739-6252-8018-457a75beae4b',
				].map( ( appDefinitionId ) => {
					return { appDefinitionId };
				} ),
			},
		},
		true,
		true,
	],
] )( 'wix: %s', async ( har, config, errorsExpected, logExpected ) => {
	const input = fs.readFileSync( path.join( __dirname, 'fixtures', har ) );

	function stripFirstPubDate( xml ) {
		return xml
			.toString()
			.replace( /<pubDate>.*?<\/pubDate>/, '<pubDate></pubDate>' )
			.trim();
	}

	return getWXRFromWixHAR(
		fetchFromHAR,
		JSON.parse( input ),
		config,
		startExport
	)
		.then( ( wxrDriver ) => wxrDriver.export() )
		.then( ( xml ) => {
			expect( stripFirstPubDate( xml ) ).toMatchSnapshot();

			if ( logExpected ) {
				expect( console ).toHaveLogged();
			}
			if ( errorsExpected ) {
				expect( console ).toHaveErrored();
			}
		} );
} );
