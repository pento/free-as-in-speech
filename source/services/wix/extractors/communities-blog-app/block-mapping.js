/**
 * WordPress dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';
import { applyFormat, create, toHTMLString } from '@wordpress/rich-text';

const blockMap = {
	unstyled: ( block ) => {
		// Don't transform empty lines into paragraphs.
		if ( ! block.text || block.text === '<br>' ) {
			return false;
		}

		return createBlock( 'core/paragraph', {
			content: formatText( block ),
			align: block.data.textAlignment,
		} );
	},
};

const formatText = ( block ) => {
	if ( ! block.inlineStyleRanges ) {
		return block.text;
	}

	const formatMap = {
		bold: { type: 'strong' },
		italic: { type: 'em' },
	};

	const richText = block.inlineStyleRanges.reduce( ( workingText, style ) => {
		const styleName = style.style.toLowerCase();

		if ( ! formatMap[ styleName ] ) {
			// eslint-disable-next-line no-console
			console.log( `There's no style registered for '${ styleName }'` );
			return workingText;
		}

		return applyFormat(
			workingText,
			formatMap[ styleName ],
			style.offset,
			style.offset + style.length
		);
	}, create( { text: block.text } ) );

	return toHTMLString( { value: richText } );
};

export const serializeWixBlocksToWordPressBlocks = ( wixBlocks ) => {
	return wixBlocks
		.map( ( wixBlock ) => {
			if ( blockMap[ wixBlock.type ] ) {
				return blockMap[ wixBlock.type ]( wixBlock );
			}

			// eslint-disable-next-line no-console
			console.log( 'Unknown Wix block', wixBlock );
			return false;
		} )
		.filter( ( blockContent ) => blockContent !== false )
		.map( ( wpBlock ) => serialize( wpBlock ) )
		.join( '\n\n' );
};
