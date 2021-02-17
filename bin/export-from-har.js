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
const startExport = require( '../source/services/wix' );

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
	.arguments( '<harfile>', 'The file to import' )
	.description( 'Extract from Wix' )
	.action( ( harfile, options ) => {
		const config = {
			initialState: {},
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
		).then(
			( wxr ) => console.log( wxr ) // eslint-disable-line no-console
		);
	} );

program.parse( process.argv );
