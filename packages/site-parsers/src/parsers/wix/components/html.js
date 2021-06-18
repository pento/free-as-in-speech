const axios = require( 'axios' );
const { createBlock } = require( '@wordpress/blocks' );

const SUPPORTED_SOURCE = [ 'htmlEmbedded' ];

module.exports = {
	type: 'HtmlComponent',
	parseComponent: async ( component, { metaData } ) => {
		if ( SUPPORTED_SOURCE.indexOf( component.dataQuery.sourceType ) === -1 )
			return null;
		const htmlContentUrl =
			metaData.serviceTopology.staticHTMLComponentUrl +
			component.dataQuery.url;

		return await axios
			.get( htmlContentUrl )
			.then( ( response ) => response.data )
			.then( ( content ) => createBlock( 'core/html', { content } ) );
	},
};
