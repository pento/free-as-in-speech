const { v4: uuidv4 } = require('uuid');

module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: 'static-pages',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {

		const url = new URL(
			'https://editor.wix.com/html/editor/web/renderer/render/document/' + config.editorSiteId
		);

		url.searchParams.set( 'metaSiteId', config.metaSiteId );
		url.searchParams.set( 'editorSessionId', uuidv4() );
		url.searchParams.set( 'referralInfo', 'my-account' );
		return await window
			.fetch( url, {
				credentials: 'include',
				referrer: 'https://manage.wix.com/dashboard/' + config.metaSiteId + '/home?referralInfo=my-sites',
				mode: 'same-origin',
				headers: {
			        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			        "Upgrade-Insecure-Requests": 1,
				}
			} )
			.then( ( result ) => result.text() )
			.then( ( html ) => {
				console.log(html)
			} );
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
