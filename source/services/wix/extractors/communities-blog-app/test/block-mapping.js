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

	test( 'serializeWixBlocksToWordPressBlocks handles "unstyled" blocks as pargraphs', () => {
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
} );
