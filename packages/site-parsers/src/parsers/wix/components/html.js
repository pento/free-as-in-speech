const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

const SUPPORTED_SOURCE = [ 'htmlEmbedded' ];

module.exports = {
	type: 'HtmlComponent',
	parseComponent: async ( component, { metaData } ) => {
		Logger( 'wix' ).log( 'HtmlComponent' );
		if ( SUPPORTED_SOURCE.indexOf( component.dataQuery.sourceType ) === -1 )
			return null;

		const htmlContentUrl =
			metaData.serviceTopology.staticHTMLComponentUrl +
			component.dataQuery.url;

		return await Promise.resolve()
			.then( () => window.fetch( htmlContentUrl ) )
			.then( ( response ) => response.text() )
			.then( ( content ) => createBlock( 'core/html', { content } ) );
	},
};
