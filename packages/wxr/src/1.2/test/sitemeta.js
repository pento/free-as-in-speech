/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Site Meta', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.setSiteMeta( {
			title: 'A Title',
			link: 'https://wordpress.org/',
			description: 'A description',
			language: 'art-x-emoji',
			wxrVersion: '1.2.3.4.5', // Should not be writable, test with a fake value.
			siteUrl: 'https://make.wordpress.org/',
			blogUrl: 'https://wordpress.org/news/',
		} );

		const xml = await wxr.export();

		const cleanedXml = xml.replace(
			/<pubDate>.*?<\/pubDate>/,
			'<pubDate></pubDate>'
		);

		expect( cleanedXml ).toMatchSnapshot();
	} );

	test( 'siteUrl and BlogUrl copy from link', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.setSiteMeta( {
			link: 'https://wordpress.org/',
		} );

		const xml = await wxr.export();

		const cleanedXml = xml.replace(
			/<pubDate>.*?<\/pubDate>/,
			'<pubDate></pubDate>'
		);

		expect( cleanedXml ).toMatchSnapshot();
	} );
} );
