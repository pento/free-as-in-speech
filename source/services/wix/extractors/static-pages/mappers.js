const { createBlock, pasteHandler } = require( '@wordpress/blocks' );

const handlerMapper = ( key ) => ( accumulator, currentValue ) => {
	accumulator[ currentValue[ key ] ] = currentValue;
	return accumulator;
};

const containerHandlers = [
	require( './containers/column.js' ),
	require( './containers/columns.js' ),
].reduce( handlerMapper( 'componentType' ), {} );

const componentHandlers = [
	require( './components/image.js' ),
	require( './components/button.js' ),
].reduce( handlerMapper( 'type' ), {} );
let placeholderId = 0;

const wrapResult = ( block, component ) => {
	block.designQuery = component.designQuery;
	return block;
};

module.exports = {
	containerMapper: ( component, recursiveComponentParser ) => {
		if ( component.componentType in containerHandlers ) {
			return wrapResult(
				containerHandlers[ component.componentType ].parseComponent(
					component,
					recursiveComponentParser
				),
				component
			);
		}

		return null;
	},

	componentMapper: ( component, addMediaAttachment, metaData, page ) => {
		if ( ! component.dataQuery ) {
			return null;
		}
		if ( component.dataQuery.type in componentHandlers ) {
			return wrapResult(
				componentHandlers[ component.dataQuery.type ].parseComponent(
					component,
					addMediaAttachment,
					metaData,
					page
				),
				component
			);
		}

		switch ( component.dataQuery.type ) {
			case 'TextInput':
				placeholderId += 1;
				if ( undefined === page.meta ) {
					page.meta = {};
				}
				page.meta[ 'placeholder-' + placeholderId ] = {
					type: 'text',
					label: component.dataQuery.label,
				};
				return createBlock( 'core-import/plugin-placeholder', {
					id: placeholderId,
				} );
		}

		if ( component.dataQuery.text ) {
			return pasteHandler( { HTML: component.dataQuery.text } );
		}
	},
};
