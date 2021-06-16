const { pasteHandler } = require( '@wordpress/blocks' );

const handlerMapper = ( key ) => ( accumulator, currentValue ) => {
	accumulator[ currentValue[ key ] ] = currentValue;
	return accumulator;
};

const containerHandlers = [
	require( './containers/form.js' ),
	require( './containers/column.js' ),
	require( './containers/columns.js' ),
	require( './containers/mobile.js' ),
].reduce( handlerMapper( 'componentType' ), {} );

const componentHandlers = [
	require( './components/menu.js' ),
	require( './components/image.js' ),
	require( './components/image-list.js' ),
	require( './components/button.js' ),
	require( './components/button-stylable.js' ),
  require( './components/google-map.js' ),
	require( './components/separator.js' ),
	require( './components/anchor.js' ),
	require( './components/tpa-widget.js' ),
	require( './components/twitter-follow.js' ),
	require( './components/audio.js' ),
	require( './components/video.js' ),
].reduce( handlerMapper( 'type' ), {} );

const wrapResult = ( block, component ) => {
	if ( block ) {
		block.designQuery = component.designQuery;
	}
	return block;
};

/**
 * @param {string} componentType (ex. wysiwyg.viewer.components.FiveGridLine)
 * @return {string} (ex. FiveGridLine)
 */
const getTypeFromComponentPath = ( componentType ) => {
	const type = componentType.split( '.' );

	return type[ type.length - 1 ];
};

module.exports = {
	containerMapper: (
		component,
		recursiveComponentParser,
		resolver,
		addMediaAttachment,
		addObject
	) => {
		if ( component.componentType in containerHandlers ) {
			return wrapResult(
				containerHandlers[ component.componentType ].parseComponent(
					component,
					recursiveComponentParser,
					resolver,
					addMediaAttachment,
					addObject
				),
				component
			);
		}

		return component.components
			.map( recursiveComponentParser )
			.flat()
			.filter( Boolean );
	},

	componentMapper: ( component, meta ) => {
		const type =
			( component.dataQuery && component.dataQuery.type ) ||
			getTypeFromComponentPath( component.componentType );

		if ( type in componentHandlers ) {
			return wrapResult(
				componentHandlers[ type ].parseComponent( component, meta ),
				component
			);
		}

		if ( component.dataQuery && component.dataQuery.text ) {
			return pasteHandler( { HTML: component.dataQuery.text } );
		}

		return null;
	},
};
