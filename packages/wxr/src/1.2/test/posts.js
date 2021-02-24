/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Posts', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addCategory( {
			slug: 'some-cat',
			name: 'Some Category',
		} );

		wxr.addTag( {
			slug: 'some-tag',
			name: 'Some Tag',
		} );

		wxr.addTerm( {
			taxonomy: 'my-tax',
			slug: 'some-term',
			name: 'Some Term',
		} );

		wxr.addPost( {
			id: 1,
			title: 'A Post Title',
			link: 'https://wordpress.org/',
			date: '1970-01-01T00:00:01.000Z',
			author: 'pento',
			guid: 'should-be-a-proper-guid',
			description: 'This will not be written', // Non-writeable field.
			content: 'The post content',
			excerpt: 'A brief excerpt from the content',
			postDate: '1970-01-01T00:00:02.000Z',
			date_gmt: '1970-01-01T00:00:03.000Z',
			modified: '1970-01-01T00:00:04.000Z',
			modified_gmt: '1970-01-01T00:00:05.000Z',
			comment_status: 'closed',
			ping_status: 'open',
			status: 'draft',
			menu_order: 1,
			type: 'post',
			password: 'a-strong-password',
			sticky: true,
			attachment_url: 'https://make.wordpress.org', // Won't be written for this post type.
			terms: [
				{
					type: 'category',
					slug: 'some-cat',
					name: 'Some Category',
				},
				{
					type: 'tag',
					slug: 'some-tag',
					name: 'Some Tag',
				},
				{
					type: 'my-tax',
					slug: 'some-term',
					name: 'Some Term',
				},
			],
			meta: [ { key: 'talk about', value: 'pop music' } ],
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
