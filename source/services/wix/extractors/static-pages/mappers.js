const { createBlock, pasteHandler } = require( '@wordpress/blocks' );

const handlerMapper = ( key ) => ( accumulator, currentValue ) => {
	accumulator[ currentValue[ key ] ] = currentValue;
	return accumulator;
};

const containerHandlers = [
	require( './containers/form.js' ),
	require( './containers/column.js' ),
	require( './containers/columns.js' ),
].reduce( handlerMapper( 'componentType' ), {} );

const componentHandlers = [
	require( './components/image.js' ),
	require( './components/button.js' ),
].reduce( handlerMapper( 'type' ), {} );
let placeholderId = 0;

module.exports = {
	containerMapper: ( component, recursiveComponentParser ) => {
		if ( component.componentType in containerHandlers ) {
			return containerHandlers[ component.componentType ].parseComponent(
				component,
				recursiveComponentParser
			);
		}

		return null;
	},

	componentMapper: ( component, addMediaAttachment, metaData, page ) => {
		component = component.dataQuery;
		if ( ! component ) {
			return null;
		}
		if ( component.componentType in componentHandlers ) {
			return componentHandlers[ component.type ].parseComponent(
				component,
				addMediaAttachment,
				metaData,
				page
			);
		}

		switch ( component.componentType ) {
			case 'TextInput':
				placeholderId += 1;
				if ( undefined === page.meta ) {
					page.meta = {};
				}
				page.meta[ 'placeholder-' + placeholderId ] = {
					type: 'text',
					label: component.label,
				};
				return createBlock( 'core-import/plugin-placeholder', {
					id: placeholderId,
				} );
		}

		if ( component.text ) {
			return pasteHandler( { HTML: component.text } );
		}
	},
};
