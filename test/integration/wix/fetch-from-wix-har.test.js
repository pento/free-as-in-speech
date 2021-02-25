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
	[
		'empty.har',
		'empty.wxr',
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
		'wix-basic.wxr',
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
		false,
		false,
	],
	[
		'easyblog.har',
		'easyblog.wxr',
		{
			initialState: {
				embeddedServices: [
					'13d7e48f-0739-6252-8018-457a75beae4b',
				].map( ( appDefinitionId ) => {
					return { appDefinitionId };
				} ),
			},
		},
		false,
		true,
	],
] )(
	'wix: %s -> %s',
	async ( har, wxr, config, errorsExpected, logExpected ) => {
		const input = fs.readFileSync(
			path.join( __dirname, 'fixtures', har )
		);
		const output = fs.readFileSync(
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
			JSON.parse( input ),
			config,
			wixServices
		).then( ( xml ) => {
			expect( stripFirstPubDate( output ) ).toEqual(
				stripFirstPubDate( xml )
			);
			if ( logExpected ) {
				expect( console ).toHaveLogged();
			}
			if ( errorsExpected ) {
				expect( console ).toHaveErrored();
			}
		} );
	}
);
