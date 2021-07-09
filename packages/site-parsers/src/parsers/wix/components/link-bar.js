const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

const getServiceNameFromUrl = ( url ) => {
	return new URL( url ).hostname.replace( 'www.', '' ).split( '.' )[ 0 ];
};

module.exports = {
	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'LinkBar' );

		const socialLinkAttrs = component.dataQuery.items.map( ( item ) => {
			const url = item.link && item.link.url;

			return {
				url,
				label: item.title,
				service: url && getServiceNameFromUrl( url ),
			};
		} );

		return createBlock(
			'core/social-links',
			{ openInNewTab: true },
			socialLinkAttrs.map( ( attrs ) =>
				createBlock( 'core/social-link', attrs )
			)
		);
	},
};
