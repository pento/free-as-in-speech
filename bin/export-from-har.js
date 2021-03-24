require( 'fake-indexeddb/auto' );

const noop = function () {};
const { JSDOM, ResourceLoader } = require( 'jsdom' );
class Window {
	constructor( jsdomConfig = {} ) {
		const { proxy, strictSSL, userAgent } = jsdomConfig;
		const resources = new ResourceLoader( {
			proxy,
			strictSSL,
			userAgent,
		} );
		return new JSDOM(
			'',
			Object.assign( jsdomConfig, {
				resources,
			} )
		).window;
	}
}

global.window = new Window( { url: 'http://localhost' } );
global.document = window.document;
global.requestAnimationFrame = global.cancelAnimationFrame = noop;
global.navigator = window.navigator;
global.Mousetrap = {
	init: noop,
	prototype: { stopCallback: noop },
};
window.matchMedia = global.matchMedia = () => ( { addListener: noop } );
global.Node = window.Node;

const { registerCoreBlocks } = require( '@wordpress/block-library' );

registerCoreBlocks();

const fetchFromHAR = require( 'fetch-from-har' );
const getWXRFromWixHAR = require( './lib/get-wxr-from-wix-har' );
const fs = require( 'fs' );
const { startExport } = require( '../source/services/wix' );

const { Command } = require( 'commander' );
const program = new Command();
program.version( '1.0.0' );
program
	.command( 'wix' )
	.option(
		'-a, --appDefinitionId <appDefinitionId,...>',
		'Which Wix module to extract',
		'all'
	)
	.option( '-m, --metaSiteId <metaSiteId>', 'The UUID representing', null )
	.arguments( '<harfile>', 'The file to import' )
	.arguments( '<wxrfile>', 'Write to this WXR file' )
	.description( 'Extract from Wix' )
	.action( ( harfile, wxrfile, options ) => {
		const config = {
			initialState: {
				siteMetaData: {
					metaSiteId: options.metaSiteId,
				},
			},
		};

		if ( typeof options.appDefinitionId === 'string' ) {
			if ( 'all' === options.appDefinitionId ) {
				config.extractAll = true;
				options.appDefinitionId = [];
			} else {
				options.appDefinitionId = options.appDefinitionId.split( /,/ );
			}
		}

		config.initialState.embeddedServices = options.appDefinitionId.map(
			( appDefinitionId ) => {
				return {
					appDefinitionId,
				};
			}
		);

		getWXRFromWixHAR(
			fetchFromHAR,
			JSON.parse( fs.readFileSync( harfile ) ),
			config,
			startExport
		)
			.then( ( WXRDriver ) => WXRDriver.export() )
			.then(
				( wxr ) => fs.writeFileSync( wxrfile, wxr )
			);
	} );

program.parse( process.argv );
