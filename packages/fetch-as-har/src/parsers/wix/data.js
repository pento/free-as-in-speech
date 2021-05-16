const resolveQueries = ( input, data, masterPage ) => {
	// skip resolving for non-objects
	if ( typeof input !== 'object' ) {
		return input;
	}

	// walk over all object keys and resolve known queries
	Object.entries( input ).forEach( ( entry ) => {
		const key = entry[ 0 ];
		const val = entry[ 1 ];
		let location = 'document_data';
		switch ( key ) {
			case 'designQuery':
			case 'background':
			case 'mediaRef':
				location = 'design_data';
				break;
			case 'propertyQuery':
				location = 'component_properties';
				break;
			case 'connectionQuery':
				location = 'connections_data';
				break;
		}

		if ( Array.isArray( val ) ) {
			// Some values can be an array of things that need to get resolved
			// Example: `input.linkList = [ '#foo', '#baz' ]`
			input[ key ] = val.map( ( item ) => {
				if ( ! item || typeof item.valueOf() !== 'string' ) return item;
				if ( item.substr( 0, 1 ) !== '#' ) return item;
				const query = item.replace( /^#/, '' );
				return query
					? resolveQueries(
							data[ location ][ query ],
							data,
							masterPage
					  )
					: item;
			} );
		} else if (
			val &&
			typeof val.valueOf() === 'string' &&
			( val.substr( 0, 1 ) === '#' || location !== 'document_data' )
		) {
			// Others are just a string
			// Example: `input.link = '#baz'`
			const query = val.replace( /^#/, '' );
			input[ key ] = query
				? resolveQueries(
						data[ location ][ query ] ||
							masterPage[ location ][ query ],
						data,
						masterPage
				  )
				: val;
		}
	} );

	// Components are already objects but we need to deeply resolve their contents
	if ( input.components ) {
		input.components = input.components.map( ( subComp ) =>
			resolveQueries( subComp, data, masterPage )
		);
	}

	return input;
};

module.exports = { resolveQueries };
