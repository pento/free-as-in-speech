/**
 * External dependencies
 */
const { serialize } = require( '@wordpress/blocks' );

/**
 * Internal dependencies
 */
const { asyncForEach, IdFactory } = require( '../../utils' );
const { maybeAddCoverBlock } = require( './containers/cover.js' );
const { containerMapper, componentMapper } = require( './mappers.js' );
const {
	resolveQueries,
	addMediaAttachment,
	addObject,
	getThemeDataRef,
	asyncComponentsParser,
} = require( './data' );

const addHeaderPage = ( data, masterPage ) => {
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
};

const addFooterPage = ( data, masterPage ) => {
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
};

const parsePages = async ( data, metaData, masterPage, config ) => {
	await asyncForEach( data.pages, async ( page ) => {
		const resolver = ( component ) =>
			resolveQueries( component, page.config.data, masterPage.data );
		const meta = {
			resolver,
			metaData,
			page,
			fetch: config.fetch,
			debug: config.debug,
			addObject: addObject.bind( null, data ),
			addMediaAttachment: addMediaAttachment.bind( null, data ),
			getThemeDataRef: getThemeDataRef.bind( null, page ),
		};

		const recursiveComponentParser = async ( component ) => {
			component = resolver( component );

			if ( component.components ) {
				return maybeAddCoverBlock(
					await containerMapper(
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

		if ( typeof page.config.structure === 'undefined' ) {
			return;
		}

		const parsedComponents = await asyncComponentsParser(
			page.config.structure.components,
			recursiveComponentParser
		);

		page.guid = page.url;
		page.link = page.url;
		page.content = serialize( parsedComponents );
	} );
};

module.exports = {
	addHeaderPage,
	addFooterPage,
	parsePages,
};
