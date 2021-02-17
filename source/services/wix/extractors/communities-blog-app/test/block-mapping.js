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

		const expected = `<!-- wp:image {"align":"center"} -->
<div class="wp-block-image"><figure class="aligncenter"><a href="https://wordpress.org/" target="_blank" rel="noopener"><img src="https://static.wixstatic.com/media/image1.png" alt="image1 alt text"/></a><figcaption>image1 caption</figcaption></figure></div>
<!-- /wp:image -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
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

		const expected = `<!-- wp:video -->
<figure class="wp-block-video"><video controls poster="https://static.wixstatic.com/media/video1_thumb.jpg" src="https://video.wixstatic.com/video1.mp4"></video></figure>
<!-- /wp:video -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
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

		const expected = `<!-- wp:embed {"url":"https://www.youtube.com/watch?v=RWf83UX4vKs","align":"right"} -->
<figure class="wp-block-embed alignright"><div class="wp-block-embed__wrapper">
https://www.youtube.com/watch?v=RWf83UX4vKs
</div></figure>
<!-- /wp:embed -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
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

		const expected = `<!-- wp:gallery {"columns":4} -->
<figure class="wp-block-gallery columns-4 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image2.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image3.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image4.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image5.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image6.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image7.png"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://static.wixstatic.com/media/image8.png"/></figure></li></ul></figure>
<!-- /wp:gallery -->`;

		expect(
			serializeWixBlocksToWordPressBlocks( blocks, testData )
		).toEqual( expected );
	} );
} );
