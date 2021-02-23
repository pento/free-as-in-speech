module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: '13d7e48f-0739-6252-8018-457a75beae4b',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		const url = new URL( config.dashboardUrl );
		url.pathname = '';
		url.searchParams.set( 'instance', config.instance );
		return await window
			.fetch( url )
			.then( ( result ) => console.log );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
	},
};
