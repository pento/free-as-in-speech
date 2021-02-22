/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Authors', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addAuthor( {
			id: 1,
			login: 'pento',
			email: 'notmyrealemail@wordpress.org',
			display_name: 'pento',
			first_name: 'Gary',
			last_name: 'Pendergast',
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );

	test( 'Multiple authors are handled', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addAuthor( {
			login: 'pento',
		} );

		wxr.addAuthor( {
			login: 'not-pento',
		} );

		wxr.addAuthor( {
			login: 'someone-else',
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
