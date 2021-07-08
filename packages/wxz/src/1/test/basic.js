/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXR_VERSION, WXRDriver } = require( '../index.js' );

describe( 'Basic behaviour', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'Correct WXR version', () => {
		expect( WXR_VERSION ).toEqual( '1.3' );
	} );

	test( 'WXRDriver class is defined', () => {
		expect( typeof WXRDriver ).toBe( 'function' );
	} );

	test( 'Creates an empty file', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
