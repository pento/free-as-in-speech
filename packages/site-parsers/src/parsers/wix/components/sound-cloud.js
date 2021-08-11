const { createBlock } = require( '@wordpress/blocks' );
const { Logger } = require( '../../../utils' );

module.exports = {
	parseComponent: ( component, { getThemeDataRef } ) => {
		Logger( 'wix' ).log( 'SoundCloud' );

		const themeData = getThemeDataRef( component.styleId );

		if (
			themeData &&
			themeData.style &&
			themeData.style.properties &&
			themeData.style.properties.param_font_resolveUrl
		) {
			const url = themeData.style.properties.param_font_resolveUrl.replace(
				/^"|"$/g,
				''
			);

			return createBlock( 'core/embed', { url } );
		}
	},
};
