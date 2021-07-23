const cheerio = require( 'cheerio' );
const fetchNode = require( 'node-fetch' ).default;
const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'VectorImage',
	parseComponent: async ( component, { metaData, fetch } ) => {
		const alt = component.dataQuery.alt;
		const title = component.dataQuery.title;
		const svgContentUrl =
			metaData.serviceTopology.staticServerUrl +
			'shapes/' +
			component.dataQuery.svgId;

		return await Promise.resolve()
			.then( () => fetch( svgContentUrl ) )
			.catch( () => fetchNode( svgContentUrl ) )
			.then( ( response ) => response.text() )
			.then( ( svgData ) => {
				const $ = cheerio.load( svgData );

				return $( 'svg' )
					.attr( {
						role: 'img',
						...( title && { 'aria-label': title } ),
					} )
					.prepend(
						( title ? `<title>${ escape( title ) }</title>` : '' ) +
							( alt ? `<desc>${ escape( alt ) }</desc>` : '' )
					)
					.toString();
			} )
			.then( ( content ) => createBlock( 'core/html', { content } ) );
	},
};
