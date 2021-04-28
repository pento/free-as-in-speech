const cheerio = require( 'cheerio' );
const IdFactory = require( '../../../../utils/idfactory.js' );

const extractConfigData = ( html ) => {
	const configData = {};

	// The configuration data is embedded in script tags in the HTML.
	const $ = cheerio.load( html );
	$( 'script' ).each( ( idx, scriptTag ) => {
		const currentTag = $( scriptTag );

		if ( currentTag.attr( 'src' ) !== undefined ) {
			return;
		}

		const vars = currentTag.html().split( /\s*var\s/ );
		const metaConfigurationRegExp = /^(siteHeader|editorModel|serviceTopology)\s*=\s*(.*)$/;

		for ( let i = 0; i < vars.length; i++ ) {
			let match;
			if ( ( match = metaConfigurationRegExp.exec( vars[ i ] ) ) ) {
				const metaName = match[ 1 ];
				const metaConfigRawJSON = match[ 2 ].replace( /[;\s]+$/, '' );
				configData[ metaName ] = JSON.parse( metaConfigRawJSON );
			}
		}
	} );

	return configData;
};

const fetchPageJson = ( topology, editorUrl ) => ( page ) => {
	return window
		.fetch( topology.replace( '{filename}', page.pageJsonFileName ), {
			referrer: editorUrl,
			mode: 'same-origin',
			headers: {
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Upgrade-Insecure-Requests': 1,
			},
		} )
		.then( ( result ) => result.json() )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} )
		.then( ( json ) => {
			page.postId = IdFactory.get( page.pageId );
			page.config = json;
			return page;
		} )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} );
};

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

module.exports = { extractConfigData, fetchPageJson, resolveQueries };
