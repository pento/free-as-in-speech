/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Objects', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'Object ID increments', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		const first = await wxr.addObject( 'contact-form', {
			email: 'gary@pento.net',
			fields: [],
		} );

		const second = await wxr.addObject( 'contact-form', {
			email: 'foo@bar.com',
			fields: [],
		} );

		expect( first ).toEqual( 1 );
		expect( second ).toEqual( 2 );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
