/**
 * WordPress dependencies
 */
const { createBlock, serialize } = require( '@wordpress/blocks' );
const { applyFormat, create, toHTMLString } = require( '@wordpress/rich-text' );
const IdFactory = require( '../../../../utils/idfactory.js' );
const slug = require( 'slugify' );

/**
 * The definition map for converting Wix blocks to WordPress blocks.
 *
 * The key is the Wix block type.
 *
 * The value is a function that takes the block object, and returns an
 * equivalent WordPress block.
 */
const blockMap = {
	atomic: ( block, { entityMap, ownerSiteMemberId }, attachments ) => {
		if ( block.entityRanges.length === 0 ) {
			// eslint-disable-next-line no-console
			console.log( 'Entity block with no entity range', block );
			return false;
		}

		const entity = entityMap[ block.entityRanges[ 0 ].key ];

		switch ( entity.type.toLowerCase() ) {
			case 'wix-draft-plugin-image':
				const imageAttributes = {
					url: `https://static.wixstatic.com/media/${ entity.data.src.file_name }`,
					align: entity.data.config.alignment,
					alt: null,
					caption: null,
				};

				if ( entity.data.metadata ) {
					imageAttributes.alt = entity.data.metadata.alt;
					imageAttributes.caption = entity.data.metadata.caption;
				}

				if ( entity.data.link ) {
					imageAttributes.href = entity.data.link.url;
					imageAttributes.linkTarget = entity.data.link.target;
					imageAttributes.rel = entity.data.link.rel;
				}

				if ( ! IdFactory.exists( entity.data.src.file_name ) ) {
					attachments.push( {
						id: IdFactory.get( entity.data.src.file_name ),
						title: imageAttributes.alt || entity.data.src.file_name,
						excerpt: imageAttributes.caption || '',
						content: imageAttributes.caption || '',
						link: imageAttributes.url,
						guid: imageAttributes.url,
						commentStatus: 'closed',
						name: slug( entity.data.src.file_name ),
						type: 'attachment',
						attachment_url: imageAttributes.url,
						meta: [
							{
								key: '_wp_attachment_attachment_alt',
								value: imageAttributes.alt || null,
							},
						],
					} );
				}

				return createBlock( 'core/image', imageAttributes );

			case 'wix-draft-plugin-video':
				// Uploaded videos should be treated as video blocks.
				if ( entity.data.isCustomVideo ) {
					return createBlock( 'core/video', {
						src: `https://video.wixstatic.com/${ entity.data.src.pathname }`,
						poster: `https://static.wixstatic.com/${ entity.data.src.thumbnail.pathname }`,
					} );
				}

				// All other videos are some form of embed.
				return createBlock( 'core/embed', {
					url: entity.data.src,
					align: entity.data.config.alignment,
				} );

			case 'wix-draft-plugin-gallery':
				const gallerySettings = {};

				gallerySettings.images = entity.data.items.map( ( img ) => ( {
					url: `https://static.wixstatic.com/media/${ img.url }`,
				} ) );

				if ( entity.data.styles.numberOfImagesPerRow > 0 ) {
					gallerySettings.columns =
						entity.data.styles.numberOfImagesPerRow;
				}

				return createBlock( 'core/gallery', gallerySettings );

			case 'wix-draft-plugin-file-upload':
				return createBlock( 'core/file', {
					href: `https://${ ownerSiteMemberId }.usrfiles.com/ugd/${ entity.data.path }`,
					fileName: entity.data.name,
				} );
		}

		// eslint-disable-next-line no-console
		console.log( 'Unknown atomic entity type', entity );
		return false;
	},
	'code-block': ( block, { entityMap } ) => {
		return createBlock( 'core/code', {
			content: formatText( block, entityMap ),
		} );
	},
	blockquote: ( block, { entityMap } ) => {
		return createBlock( 'core/quote', {
			value: '<p>' + formatText( block, entityMap ) + '</p>',
			align: block.data.textAlignment,
		} );
	},
	'header-two': ( block, { entityMap } ) => {
		return createBlock( 'core/heading', {
			content: formatText( block, entityMap ),
			level: 2,
			align: block.data.textAlignment,
		} );
	},
	'header-three': ( block, { entityMap } ) => {
		return createBlock( 'core/heading', {
			content: formatText( block, entityMap ),
			level: 3,
			align: block.data.textAlignment,
		} );
	},
	'ordered-list-item': ( blocks, { entityMap } ) => {
		return createBlock( 'core/list', {
			ordered: true,
			values: blocks
				.map(
					( block ) =>
						'<li>' + formatText( block, { entityMap } ) + '</li>'
				)
				.join( '' ),
		} );
	},
	'unordered-list-item': ( blocks, { entityMap } ) => {
		return createBlock( 'core/list', {
			ordered: false,
			values: blocks
				.map(
					( block ) =>
						'<li>' + formatText( block, { entityMap } ) + '</li>'
				)
				.join( '' ),
		} );
	},
	unstyled: ( block, { entityMap } ) => {
		// Don't transform empty lines into paragraphs.
		if ( ! block.text.trim() ) {
			return false;
		}

		return createBlock( 'core/paragraph', {
			content: formatText( block, entityMap ),
			align: block.data.textAlignment,
		} );
	},
};

/**
 * Given a Wix block, generates a HTML string based upon the block text, the defined
 * inline styles, and any links definied in the entities list.
 *
 * @param {Object} block The Wix block definition.
 * @param {Object} entityMap The post entity map.
 *
 * @return {string} A HTML string generated from the block text.
 */
const formatText = ( block, entityMap ) => {
	if (
		block.inlineStyleRanges.length === 0 &&
		block.entityRanges.length === 0
	) {
		return block.text;
	}

	const formatMap = {
		bold: { type: 'core/bold' },
		italic: { type: 'core/italic' },
		underline: {
			type: 'core/underline',
			attributes: {
				style: 'text-decoration: underline;',
			},
		},
	};

	const richText = block.inlineStyleRanges.reduce( ( workingText, style ) => {
		const styleName = style.style.toLowerCase();

		if ( ! formatMap[ styleName ] ) {
			// eslint-disable-next-line no-console
			console.log( `There's no style registered for '${ styleName }'` );
			return workingText;
		}

		if ( styleName === 'underline' ) {
			// Underline can be unnecessary applied to link text, check if the range
			// of this style matches a link.

			const matchedLink = block.entityRanges.reduce(
				( matched, entityRange ) => {
					if ( matched ) {
						return matched;
					}

					if (
						entityRange.offset !== style.offset ||
						entityRange.length !== style.length
					) {
						return false;
					}

					return (
						entityMap[ entityRange.key ].type.toLowerCase() ===
						'link'
					);
				},
				false
			);

			if ( matchedLink ) {
				return workingText;
			}
		}

		return applyFormat(
			workingText,
			formatMap[ styleName ],
			style.offset,
			style.offset + style.length
		);
	}, create( { text: block.text } ) );

	const entitisedText = block.entityRanges.reduce(
		( workingText, entityRange ) => {
			const entity = entityMap[ entityRange.key ];

			if ( entity.type.toLowerCase() === 'link' ) {
				const linkFormat = {
					type: 'core/link',
					attributes: { url: entity.data.url },
				};

				if ( entity.data.target === '_blank' ) {
					linkFormat.attributes.target = '_blank';
					linkFormat.attributes.rel = 'noreferrer noopener';
				}

				return applyFormat(
					workingText,
					linkFormat,
					entityRange.offset,
					entityRange.offset + entityRange.length
				);
			}

			// eslint-disable-next-line no-console
			console.log( 'Unknown text entity type', entity );
			return workingText;
		},
		richText
	);

	return toHTMLString( { value: entitisedText } );
};

/**
 * Given a list of Wix blocks, convert them to a serialized form of WordPress blocks.
 *
 * @param {Object} wixBlocks The Wix blocks.
 * @param {Object} data      Additional post data.
 * @param {Object} attachments The attachments that were embedded in the block.
 * @return {string} The serialized WordPress blocks.
 */
module.exports = ( wixBlocks, data, attachments ) => {
	let listType = '';
	const listBuffer = [];

	return wixBlocks
		.map( ( wixBlock, blockIndex ) => {
			// Wix stores each list item as an individual block, we need to merge them together.
			// Store list blocks in the listBuffer until we're at the last item in the current list,
			// then send that as a single "block".
			if (
				[ 'unordered-list-item', 'ordered-list-item' ].includes(
					wixBlock.type
				)
			) {
				if ( ! listType ) {
					listType = wixBlock.type;
				}
				listBuffer.push( wixBlock );

				if (
					wixBlocks[ blockIndex + 1 ] &&
					wixBlocks[ blockIndex + 1 ].type === listType
				) {
					// The next block is part of the list, so move on to that one.
					return false;
				}

				// We're at the last list item, process the list now.
				const wpBlock = blockMap[ listType ](
					listBuffer,
					data,
					attachments
				);

				// Clean up the buffer.
				listType = '';
				listBuffer.splice( 0 );

				return wpBlock;
			}

			if ( blockMap[ wixBlock.type ] ) {
				return blockMap[ wixBlock.type ]( wixBlock, data, attachments );
			}

			// eslint-disable-next-line no-console
			console.log( 'Unknown Wix block', {
				block: wixBlock,
				data,
			} );
			return false;
		} )
		.filter( ( blockContent ) => blockContent !== false )
		.map( ( wpBlock ) => serialize( wpBlock ) )
		.join( '\n\n' );
};
