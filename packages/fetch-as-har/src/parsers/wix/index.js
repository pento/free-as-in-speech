/**
 * External dependencies
 */
const slug = require( 'slugify' );
const { serialize } = require( '@wordpress/blocks' );

/**
 * Internal dependencies
 */
const IdFactory = require( '../../utils/idfactory' );
const { resolveQueries } = require( './data' );
const { convertMenu } = require( './menu.js' );
const { maybeAddCoverBlock } = require( './containers/cover.js' );
const { containerMapper, componentMapper } = require( './mappers.js' );

const staticPagesParser = ( metaData, masterPage, pages ) => {
	const data = {
		pages,
		menus: [],
		attachments: [],
	};

	const addMediaAttachment = ( component ) => {
		const key = 'attachment' + ( component.name || component.uri );
		const existingId = IdFactory.exists( key );
		if ( existingId ) {
			return data.attachments[ existingId ];
		}
		component.src =
			metaData.serviceTopology.staticMediaUrl + '/' + component.uri;

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

	data.pages.forEach( ( page ) => {
		const recursiveComponentParser = ( component ) => {
			component = resolveQueries(
				component,
				page.config.data,
				masterPage.data
			);

			if ( component.components ) {
				return maybeAddCoverBlock(
					containerMapper( component, recursiveComponentParser ),
					addMediaAttachment
				);
			}

			return componentMapper(
				component,
				addMediaAttachment,
				metaData,
				page
			);
		};

		page.content = page.config.structure.components
			.map( recursiveComponentParser )
			.flat()
			.filter( Boolean )
			.map( ( wpBlock ) => serialize( wpBlock ) )
			.join( '\n\n' );
	} );

	data.menus = convertMenu( masterPage );

	return data;
};

module.exports = {
	staticPagesParser,
};
