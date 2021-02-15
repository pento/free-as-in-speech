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
		window.fetch = fetchFromHAR( JSON.parse( fs.readFileSync( harfile ) ), {
			queryComparison: ( requestValue, harValue, key, url ) => {
				if (
					'manage.wix.com' === url.host &&
					'/_api/communities-blog-node-api/_api/posts' ===
						url.pathname
				) {
					if ( 'status' === key && requestValue !== harValue ) {
						// The values must match, so this is not ok.
						return false;
					}
				}

				// Parameters don't need to match.
				return true;
			},
			fallback: ( url, entry ) => {
				console.error( 'Not Found', url ); // eslint-disable-line no-console
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
				} else if (
					u.pathname ===
					'/_serverless/dashboard-site-details/widget-data'
				) {
					entry.response.status = 200;
					entry.response.statusText = 'OK';
					entry.response.content.text = '{"quickActionsData":[]}';
				} else if ( u.pathname === '/go/site/media/files/list' ) {
					entry.response.status = 200;
					entry.response.statusText = 'OK';
					entry.response.content.text = '{"files":[]}';
				}

				return entry;
			},
		} );
		async function getWxr() {
			const config = {
				initialState: {},
			};

			if ( typeof options.appDefinitionId === 'string' ) {
				if ( 'all' === options.appDefinitionId ) {
					config.extractAll = true;
					options.appDefinitionId = [];
				} else {
					options.appDefinitionId = options.appDefinitionId.split(
						/,/
					);
				}
			}

			config.initialState.embeddedServices = options.appDefinitionId.map(
				( appDefinitionId ) => {
					return {
						appDefinitionId,
					};
				}
			);

			return await services.startExport( 'wix', config );
		}

		getWxr().then( ( wxr ) => console.log( wxr ) ); // eslint-disable-line no-console
	} );

program.parse( process.argv );
