/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Comments', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		const postId = await wxr.addPost( {
			title: 'A Post Title',
		} );

		wxr.addComment( postId, {
			id: 1234,
			post_id: 5678, // This will not be written.
			author: 'pento',
			author_email: 'notme@wordpress.org',
			author_url: 'https://pento.net',
			author_IP: '127.0.0.1',
			date: '1970-01-01T00:00:10.000Z',
			date_gmt: '1970-01-01T00:00:11.000Z',
			content: 'This is good content. Plz subscribe me.',
			approved: 'trash',
			type: 'pingback',
			user_id: 5,
			meta: [ { key: 'who?', value: 'what?' } ],
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
