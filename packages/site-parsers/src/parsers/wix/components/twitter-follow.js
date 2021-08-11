const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	type: 'TwitterFollow',

	parseComponent: ( component ) => {
		Logger( 'wix' ).log( 'TwitterFollow' );

		return createBlock( 'core/social-links', { openInNewTab: true }, [
			createBlock( 'core/social-link', {
				url: `//twitter.com/${ component.dataQuery.accountToFollow }`,
				service: 'twitter',
			} ),
		] );
	},
};
