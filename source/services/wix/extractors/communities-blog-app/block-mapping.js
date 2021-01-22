/**
 * WordPress dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';
import { applyFormat, create, toHTMLString } from '@wordpress/rich-text';

const blockMap = {
	atomic: ( block, entityMap ) => {
		if ( ! block.entityRanges ) {
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

				return createBlock( 'core/image', imageAttributes );
		}

		// eslint-disable-next-line no-console
		console.log( 'Unknown atomic entity type', entity );
		return false;
	},
	'code-block': ( block, entityMap ) => {
		return createBlock( 'core/code', {
			content: formatText( block, entityMap ),
		} );
	},
	blockquote: ( block, entityMap ) => {
		return createBlock( 'core/quote', {
			value: formatText( block, entityMap ),
			align: block.data.textAlignment,
		} );
	},
	'header-two': ( block, entityMap ) => {
		return createBlock( 'core/heading', {
			content: formatText( block, entityMap ),
			level: 2,
			align: block.data.textAlignment,
		} );
	},
	'header-three': ( block, entityMap ) => {
		return createBlock( 'core/heading', {
			content: formatText( block, entityMap ),
			level: 3,
			align: block.data.textAlignment,
		} );
	},
	unstyled: ( block, entityMap ) => {
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

const formatText = ( block, entityMap ) => {
	if ( ! block.inlineStyleRanges ) {
		return block.text;
	}

	const formatMap = {
		bold: { type: 'core/bold' },
		italic: { type: 'core/italic' },
		underline: { type: 'core/underline' },
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

export const serializeWixBlocksToWordPressBlocks = ( wixContent ) => {
	return wixContent.blocks
		.map( ( wixBlock ) => {
			if ( blockMap[ wixBlock.type ] ) {
				return blockMap[ wixBlock.type ](
					wixBlock,
					wixContent.entityMap
				);
			}

			// eslint-disable-next-line no-console
			console.log( 'Unknown Wix block', {
				block: wixBlock,
				entityMap: wixContent.entityMap,
			} );
			return false;
		} )
		.filter( ( blockContent ) => blockContent !== false )
		.map( ( wpBlock ) => serialize( wpBlock ) )
		.join( '\n\n' );
};
