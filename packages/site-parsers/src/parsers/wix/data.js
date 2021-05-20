/**
 * External dependencies
 */
const slug = require( 'slugify' );

/**
 * Internal dependencies
 */
const { IdFactory } = require( '../../utils' );

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

const addMediaAttachment = ( data, mediaUrl, component ) => {
	const key = 'attachment' + ( component.name || component.uri );
	const existingId = IdFactory.exists( key );
	if ( existingId ) {
		return data.attachments[ existingId ];
	}
	component.src = mediaUrl + '/' + component.uri;

	const attachment = {
		id: IdFactory.get( key ),
		title: component.alt,
		excerpt: component.description || '',
		content: component.description || '',
		link: component.src,
		guid: component.src,
		commentStatus: 'closed',
		name: slug( component.name || component.uri ),
		type: 'attachment',
		attachment_url: component.src,
		meta: [
			{
				key: '_wp_attachment_attachment_alt',
				value: component.alt || null,
			},
		],
	};

	data.attachments[ attachment.id ] = attachment;
	return attachment;
};

const addObject = ( data, objType, objData ) => {
	const id = 1 + data.objects.length;
	data.objects.push( {
		type: objType,
		data: objData,
	} );
	return id;
};

module.exports = {
	resolveQueries,
	addMediaAttachment,
	addObject,
};
