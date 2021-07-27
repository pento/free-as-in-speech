const cheerio = require( 'cheerio' );
const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'VectorImage',
	parseComponent: async ( component, { metaData } ) => {
		const alt = component.dataQuery.alt;
		const title = component.dataQuery.title;
		const svgContentUrl =
			metaData.serviceTopology.staticServerUrl +
			'shapes/' +
			component.dataQuery.svgId;

		return await Promise.resolve()
			.then( () => window.fetch( svgContentUrl ) )
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
