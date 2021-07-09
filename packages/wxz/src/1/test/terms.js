/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../index.js' );

describe( 'Terms and Taxonomies', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All Category fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addCategory( {
			id: 1,
			slug: 'some-cat',
			name: 'Some Category',
			description: 'A category of things.',
			meta: [
				{ key: 'a-key', value: 'a-value' },
				{ key: 'another-key', value: 'another-value' },
			],
		} );

		wxr.addCategory( {
			id: 2,
			slug: 'some-other-cat',
			parent: 'some-cat',
			name: 'Some Other Category',
			description: 'A different category of things.',
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );

	test( 'All Tag fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addTag( {
			id: 1,
			slug: 'some-tag',
			name: 'Some Tag',
			description: 'A tag for things.',
			meta: [
				{ key: 'a-key', value: 'a-value' },
				{ key: 'another-key', value: 'another-value' },
			],
		} );

		wxr.addTag( {
			id: 2,
			slug: 'some-other-tag',
			name: 'Some Other Tag',
			description: 'A different tag for things.',
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );

	test( 'All custom taxonomy fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addTerm( {
			id: 1,
			taxonomy: 'my-tax',
			slug: 'some-term',
			name: 'Some Term',
			description: 'A Term in a Taxonomy of things.',
			meta: [
				{ key: 'a-key', value: 'a-value' },
				{ key: 'another-key', value: 'another-value' },
			],
		} );

		wxr.addTerm( {
			id: 2,
			taxonomy: 'my-tax',
			slug: 'some-other-term',
			name: 'Some Other Term',
			description: 'A different Term in the same Taxonomy of things.',
		} );

		wxr.addTerm( {
			id: 3,
			taxonomy: 'my-other-tax',
			slug: 'some-term',
			name: 'Some Term',
			description: 'The same Term in a different Taxonomy of things.',
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
