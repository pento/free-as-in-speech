const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	parseComponent: ( component ) => {
		const tpaData = component.dataQuery.tpaData;

		if ( typeof tpaData === 'object' && tpaData !== null ) {
			const content = JSON.parse( tpaData.content );

			return createBlock( 'core/embed', {
				url: content.spotifyURI,
			} );
		}
	},
};
