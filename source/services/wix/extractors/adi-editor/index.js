export const settings = {
	/**
	 * The Wix application ID.
	 */
	appId: 'adi-editor',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		// The dashboard config doesn't have the storyId, but we can extract that from
		// the redirect URL when visiting the editor URL with the siteId.
		const editorUrl = await window
			.fetch( `https://manage.wix.com/editor/${ config.metaSiteId }`, {
				method: 'HEAD',
			} )
			.then( ( response ) => response.url );

		const parsedEditorUrl = new URL( editorUrl );
		const storyId = parsedEditorUrl.searchParams.get( 'storyId' );
		return window
			.fetch(
				`https://www.wix.com/_api/onboarding-server-web/story/${ storyId }:${ config.metaSiteId }`
			)
			.then( ( response ) => response.json() );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		console.log( data );
	},
};
