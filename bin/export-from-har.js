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

const fs = require( 'fs' );
const fetchFromHAR = require( 'fetch-from-har' );

const services = require( '../source/services' );
const mockMapping = {
	'manage.wix.com': {
		'/_api/communities-blog-node-api/_api/posts': {
			status: true,
		},
	},
};

const { Command } = require( 'commander' );
const program = new Command();
program.version( '1.0.0' );
program
	.command( 'wix' )
	.option(
		'-a, --appDefinitionId <appDefinitionId,...>',
		'Which Wix module to extract',
		[]
	)
	.option( '-m, --mediaToken <mediaToken>', 'Specify a media token', null )
	.arguments( '<harfile>', 'The file to import' )
	.description( 'Extract from Wix' )
	.action( ( harfile, options, command ) => {
		window.fetch = fetchFromHAR(
			JSON.parse( fs.readFileSync( harfile ) ),
			{
				queryComparison: ( requestValue, harValue, key, url ) => {
					if ( requestValue === harValue ) {
						return true;
					}
					if (
						'undefined' !==
						typeof mockMapping[ url.host ][ url.pathname ][ key ]
					) {
						return mockMapping[ url.host ][ url.pathname ][ key ];
					}
					return false;
				},
				fallback: ( url, entry ) => {
					console.log( 'Not Found', url ); // eslint-disable-line no-console
					const u = new URL( url );
					entry.response.content.text = '[]';
					// an example of how to hard-code a fallback, this will only be used if the HAR doesn't have such an entry.
					if (
						u.pathname ===
						'/_api/communities-blog-node-api/v2/tags/query'
					) {
						entry.response.status = 200;
						entry.response.statusText = 'OK';
						entry.response.content.text = '{"tags":[]}';
					}
					return entry;
				},
			}
		);
		async function getWxr() {
			if ( typeof options.appDefinitionId === 'string' ) {
				options.appDefinitionId = options.appDefinitionId.split( /,/ );
			}
			return await services.startExport( 'wix', {
				mediaToken: options.mediaToken,
				initialState: {
					embeddedServices: options.appDefinitionId.map(
						( appDefinitionId ) => {
							return {
								appDefinitionId,
							};
						}
					),
				},
			} );
		}

		getWxr().then( ( wxr ) => console.log( wxr ) ); // eslint-disable-line no-console
	} );

program.parse( process.argv );
