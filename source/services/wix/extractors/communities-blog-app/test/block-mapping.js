/**
 * WordPress dependencies
 */
const { registerCoreBlocks } = require( '@wordpress/block-library' );
require( '@wordpress/format-library' );

/**
 * Internal dependencies
 */
const serializeWixBlocksToWordPressBlocks = require( '../block-mapping' );

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
		1: {
			type: 'wix-draft-plugin-image',
			data: {
				src: {
					file_name: 'image1.png',
				},
				config: {
					alignment: 'center',
				},
				metadata: {
					alt: 'image1 alt text',
					caption: 'image1 caption',
				},
				link: {
					url: 'https://wordpress.org/',
					target: '_blank',
					rel: 'noopener',
				},
			},
		},
		2: {
			type: 'wix-draft-plugin-video',
			data: {
				isCustomVideo: true,
				config: {
					size: 'fullWidth',
					alignment: 'center',
				},
				src: {
					pathname: 'video1.mp4',
					thumbnail: {
						pathname: 'media/video1_thumb.jpg',
					},
				},
			},
		},
		3: {
			type: 'wix-draft-plugin-video',
			data: {
				src: 'https://www.youtube.com/watch?v=RWf83UX4vKs',
				config: {
					alignment: 'right',
				},
			},
		},
		4: {
			type: 'wix-draft-plugin-gallery',
			data: {
				items: [
					{ url: 'image2.png' },
					{ url: 'image3.png' },
					{ url: 'image4.png' },
					{ url: 'image5.png' },
					{ url: 'image6.png' },
					{ url: 'image7.png' },
					{ url: 'image8.png' },
				],
				styles: {
					numberOfImagesPerRow: 4,
				},
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
		expect(
			serializeWixBlocksToWordPressBlocks( [], testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
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

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles single images', () => {
		const blocks = [
			{
				type: 'atomic',
				text: '',
				inlineStyleRanges: [],
				entityRanges: [
					{
						offset: 0,
						length: 0,
						key: 1,
					},
				],
				data: {},
			},
		];

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles uploaded videos', () => {
		const blocks = [
			{
				type: 'atomic',
				text: '',
				inlineStyleRanges: [],
				entityRanges: [
					{
						offset: 0,
						length: 0,
						key: 2,
					},
				],
				data: {},
			},
		];

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles embedded videos', () => {
		const blocks = [
			{
				type: 'atomic',
				text: '',
				inlineStyleRanges: [],
				entityRanges: [
					{
						offset: 0,
						length: 0,
						key: 3,
					},
				],
				data: {},
			},
		];

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
	} );

	test( 'serializeWixBlocksToWordPressBlocks handles image galleries', () => {
		const blocks = [
			{
				type: 'atomic',
				text: '',
				inlineStyleRanges: [],
				entityRanges: [
					{
						offset: 0,
						length: 0,
						key: 4,
					},
				],
				data: {},
			},
		];

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toMatchSnapshot();
	} );
} );
