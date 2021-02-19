module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: '22bef345-3c5b-4c18-b782-74d4085112ff',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		return await window
			.fetch(
				'https://www.wix.com/_serverless/dashboard-site-details/widget-data',
				{
					credentials: 'include',
					headers: { Authorization: config.instance },
				}
			)
			.then( ( result ) => result.json() )
			.catch( () => {
				return { quickActionsData: {} };
			} );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		wxr.setSiteMeta( {
			title: data.quickActionsData.displayName,
			url: data.quickActionsData.viewUrl,
		} );
	},
};
