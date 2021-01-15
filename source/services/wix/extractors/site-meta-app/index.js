export const settings = {
	/**
	 * The Wix application ID.
	 */
	appId: -666,

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
			.then( ( result ) => result.json() );
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
