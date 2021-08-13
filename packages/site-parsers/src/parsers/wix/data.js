/**
 * External dependencies
 */
const slug = require( 'slugify' );

/**
 * Internal dependencies
 */
const { asyncForEach, IdFactory } = require( '../../utils' );

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

const isDocumentRefValid = ( refStr ) => {
	const cssColorHexReg = new RegExp( /#([a-fA-F0-9]{3}){1,2}\b/ );

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
			if ( ! item || typeof item.valueOf() !== 'string' ) return item;
			if ( item.substr( 0, 1 ) !== '#' || location !== 'document_data' )
				return item;

			const query = item.replace( /^#/, '' );
			return isDocumentRefValid( item )
				? resolveQueries(
						data[ location ][ query ] ||
							masterPage[ location ][ query ],
						data,
						masterPage
				  )
				: item;
		};

		if ( Array.isArray( val ) ) {
			// Some values can be an array of things that need to get resolved
			// Example: `input.linkList = [ '#foo', '#baz' ]`
			input[ key ] = val.map( mapItem );
		} else if (
			val &&
			typeof val.valueOf() === 'string' &&
			( val.substr( 0, 1 ) === '#' || location !== 'document_data' )
		) {
			// Others are just a string
			// Example: `input.link = '#baz'`
			const query = val.replace( /^#/, '' );
			input[ key ] = isDocumentRefValid( val )
				? resolveQueries(
						data[ location ][ query ] ||
							( masterPage && masterPage[ location ][ query ] ),
						data,
						masterPage
				  )
				: val;
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

	mediaUrl = mediaUrl.replace( /\/$/, '' );
	component.src = mediaUrl + '/' + component.uri;

	const attachment = {
		id: IdFactory.get( key ),
		title: component.alt,
		excerpt: component.description || '',
		content: component.description || '',
		link: component.src,
		guid: component.src,
		commentStatus: 'closed',
		name: slug( component.name || component.uri || key ),
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

const getThemeDataRef = ( page, id ) => {
	return (
		page &&
		page.config &&
		page.config.data &&
		page.config.data.theme_data &&
		page.config.data.theme_data[ id ]
	);
};

const asyncComponentsParser = async ( components, parser ) => {
	const parserComponents = [];
	await asyncForEach( components, async ( comp ) => {
		parserComponents.push( await parser( comp ) );
	} );

	return parserComponents.flat().filter( Boolean );
};

module.exports = {
	resolveQueries,
	addMediaAttachment,
	addObject,
	getThemeDataRef,
	asyncComponentsParser,
};
