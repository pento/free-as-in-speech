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
const { convertMenu } = require( './components/menu.js' );
const { maybeAddCoverBlock } = require( './containers/cover.js' );
const { containerMapper, componentMapper } = require( './mappers.js' );

const staticPagesParser = ( metaData, masterPage, pages = [] ) => {
	const data = {
		pages,
		menus: [],
		attachments: {},
		objects: [],
	};

	data.pages.push( {
		config: {
			structure: masterPage.structure.children.filter(
				( component ) => 'SITE_HEADER' === component.id
			)[ 0 ],
			data: masterPage.data,
		},
		pageId: 'header',
		title: 'header',
		postId: IdFactory.get( 'header' ),
		postType: 'wp_template_part',
		terms: [
			{
				type: 'wp_template_part_area',
				name: 'header',
				slug: 'header',
				id: IdFactory.get( 'term-header' ),
			},
			{
				type: 'wp_theme',
				slug: 'tt1-blocks',
				name: 'tt1-blocks',
				id: IdFactory.get( 'term-tt1-blocks' ),
			},
		],
	} );

	data.pages.push( {
		config: {
			structure: masterPage.structure.children.filter(
				( component ) => 'SITE_FOOTER' === component.id
			)[ 0 ],
			data: masterPage.data,
		},
		pageId: 'footer',
		title: 'footer',
		postId: IdFactory.get( 'footer' ),
		postType: 'wp_template_part',
		terms: [
			{
				type: 'wp_template_part_area',
				name: 'footer',
				slug: 'footer',
				id: IdFactory.get( 'term-footer' ),
			},
			{
				type: 'wp_theme',
				slug: 'wp_theme',
				name: 'tt1-blocks',
				id: IdFactory.get( 'term-tt1-blocks' ),
			},
		],
	} );

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

	const addObject = ( objType, objData ) => {
		const id = 1 + data.objects.length;
		data.objects.push( {
			type: objType,
			data: objData,
		} );
		return id;
	};

	data.pages.forEach( ( page ) => {
		const resolver = ( component ) =>
			resolveQueries( component, page.config.data, masterPage.data );
		const meta = {
			resolver,
			metaData,
			page,
			addMediaAttachment,
			addObject,
		};

		const recursiveComponentParser = ( component ) => {
			component = resolver( component );

			if ( component.components ) {
				return maybeAddCoverBlock(
					containerMapper(
						component,
						recursiveComponentParser,
						resolver,
						meta
					),
					meta
				);
			}

			return componentMapper( component, meta );
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
