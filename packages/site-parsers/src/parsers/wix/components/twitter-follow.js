const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'TwitterFollow',

	parseComponent: ( component ) => {
		return createBlock( 'core/social-links', { openInNewTab: true }, [
			createBlock( 'core/social-link', {
				url: `//twitter.com/${ component.dataQuery.accountToFollow }`,
				service: 'twitter',
			} ),
		] );
	},
};
