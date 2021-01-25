/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import { serializeWixBlocksToWordPressBlocks } from '../block-mapping';

const testData = {
	entityMap: {
		0: {
			type: 'LINK',
			mutability: 'MUTABLE',
			data: {
				url: 'https://wordpress.org/',
				target: '_blank',
				rel: 'noopener',
			},
		},
	},
};

describe( 'Block Mapping', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	test( 'serializeWixBlocksToWordPressBlocks is a function callback function', () => {
		expect( typeof serializeWixBlocksToWordPressBlocks ).toBe( 'function' );
	} );

	test( 'serializeWixBlocksToWordPressBlocks returns an empty string when passed no blocks', () => {
		expect( serializeWixBlocksToWordPressBlocks( [], testData ) ).toEqual(
			''
		);
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles "unstyled" blocks as paragraphs', () => {
		const blocks = [
			{
				type: 'unstyled',
				text: 'This is a paragraph',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'unstyled',
				text: 'This is another paragraph',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:paragraph -->
<p>This is a paragraph</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This is another paragraph</p>
<!-- /wp:paragraph -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles heading blocks', () => {
		const blocks = [
			{
				type: 'header-two',
				text: 'This is a h2',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'header-three',
				text: 'This is a h3',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:heading -->
<h2>This is a h2</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3>This is a h3</h3>
<!-- /wp:heading -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles code blocks', () => {
		const blocks = [
			{
				type: 'code-block',
				text:
					"This is some code\nIt's possibly the best code I've ever written\nmaybe.",
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:code -->
<pre class="wp-block-code"><code>This is some code
It's possibly the best code I've ever written
maybe.</code></pre>
<!-- /wp:code -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles quote blocks', () => {
		const blocks = [
			{
				type: 'blockquote',
				text: 'Use the source, Luke.',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>Use the source, Luke.</p></blockquote>
<!-- /wp:quote -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles list items', () => {
		const blocks = [
			{
				type: 'ordered-list-item',
				text: 'Number one',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'ordered-list-item',
				text: 'Number two',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'ordered-list-item',
				text: 'Number three',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'unordered-list-item',
				text: 'First',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'unordered-list-item',
				text: 'Second',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
			{
				type: 'ordered-list-item',
				text: 'Number one, second edition',
				inlineStyleRanges: [],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:list {"ordered":true} -->
<ol><li>Number one</li><li>Number two</li><li>Number three</li></ol>
<!-- /wp:list -->

<!-- wp:list -->
<ul><li>First</li><li>Second</li></ul>
<!-- /wp:list -->

<!-- wp:list {"ordered":true} -->
<ol><li>Number one, second edition</li></ol>
<!-- /wp:list -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles links in text', () => {
		const blocks = [
			{
				type: 'unstyled',
				text: 'This is a link.',
				inlineStyleRanges: [],
				entityRanges: [
					{
						offset: 8,
						length: 6,
						key: 0,
					},
				],
				data: {},
			},
		];

		const expected = `<!-- wp:paragraph -->
<p>This is <a href="https://wordpress.org/" target="_blank" rel="noreferrer noopener">a link</a>.</p>
<!-- /wp:paragraph -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles formatting in text', () => {
		const blocks = [
			{
				type: 'unstyled',
				text: 'This is bold, italic, underlined, and a combination.',
				inlineStyleRanges: [
					{
						style: 'BOLD',
						offset: 8,
						length: 4,
					},
					{
						style: 'ITALIC',
						offset: 14,
						length: 6,
					},
					{
						style: 'UNDERLINE',
						offset: 22,
						length: 10,
					},
					{
						style: 'BOLD',
						offset: 34,
						length: 17,
					},
					{
						style: 'UNDERLINE',
						offset: 34,
						length: 3,
					},
					{
						style: 'ITALIC',
						offset: 38,
						length: 13,
					},
				],
				entityRanges: [],
				data: {},
			},
		];

		const expected = `<!-- wp:paragraph -->
<p>This is <strong>bold</strong>, <em>italic</em>, <span style="text-decoration: underline;">underlined</span>, <strong><span style="text-decoration: underline;">and</span> <em>a combination</em></strong>.</p>
<!-- /wp:paragraph -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );

	test( 'serializeWixBlocksToWordPressBlocks ignores underline formatting that matches a link', () => {
		const blocks = [
			{
				type: 'unstyled',
				text: 'This is a link.',
				inlineStyleRanges: [
					{
						style: 'UNDERLINE',
						offset: 8,
						length: 6,
					},
				],
				entityRanges: [
					{
						offset: 8,
						length: 6,
						key: 0,
					},
				],
				data: {},
			},
		];

		const expected = `<!-- wp:paragraph -->
<p>This is <a href="https://wordpress.org/" target="_blank" rel="noreferrer noopener">a link</a>.</p>
<!-- /wp:paragraph -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );
} );
