const { JSDOM, ResourceLoader } = require( 'jsdom' );
const fetchNode = require( 'node-fetch' ).default;
const noop = function () {};

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
window.fetch = window.fetch || fetchNode;
global.CSS = {
	supports: noop,
	escape: noop,
};
