/**
 * External dependencies
 */
const slug = require( 'slugify' );

/**
 * Internal dependencies
 */
const { IdFactory } = require( '../../utils' );

const getProperTreeLocation = ( fieldName ) => {
	switch ( fieldName ) {
		case 'designQuery':
		case 'background':
		case 'mediaRef':
			return 'design_data';

		case 'propertyQuery':
			return 'component_properties';

		case 'connectionQuery':
			return 'connections_data';

		default:
			return 'document_data';
	}
};

const isDocumentRefValid = ( refStr, location ) => {
	const cssColorHexReg = new RegExp( /#([a-fA-F0-9]{3}){1,2}\b/ );

	if ( ! refStr || typeof refStr.valueOf() !== 'string' ) return false;

	if ( refStr.substr( 0, 1 ) !== '#' || location !== 'document_data' )
		return false;

	return ! cssColorHexReg.test( refStr );
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
		const location = getProperTreeLocation( key );

		const mapItem = ( item ) => {
			if ( isDocumentRefValid( item, location ) ) {
				const query = item.replace( /^#/, '' );
				const itemVal =
					data[ location ][ query ] ||
					masterPage[ location ][ query ];

				return resolveQueries( itemVal, data, masterPage );
			}

			return item;
		};

		if ( Array.isArray( val ) ) {
			// Some values can be an array of things that need to get resolved
			// Example: `input.linkList = [ '#foo', '#baz' ]`
			input[ key ] = val.map( mapItem );
		} else if ( isDocumentRefValid( val, location ) ) {
			// Others are just a string
			// Example: `input.link = '#baz'`
			input[ key ] = mapItem( val );
		} else if ( typeof val === 'object' ) {
			input[ key ] = resolveQueries( val, data, masterPage );
		}
	} );

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
