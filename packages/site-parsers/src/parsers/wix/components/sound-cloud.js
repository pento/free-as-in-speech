const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	parseComponent: ( component, { getThemeDataRef } ) => {
		const themeData = getThemeDataRef( component.styleId );

		if (
			themeData &&
			themeData.style &&
			themeData.style.properties &&
			themeData.style.properties.param_font_resolveUrl
		) {
			const url = themeData.style.properties.param_font_resolveUrl.replace(
				/^(")|(")$/g,
				''
			);

			return createBlock( 'core/embed', { url } );
		}
	},
};
