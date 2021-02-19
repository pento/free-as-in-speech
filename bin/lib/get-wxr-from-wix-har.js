async function getWXRFromWixHAR( fetchFromHAR, har, config, startExport ) {
	window.fetch = fetchFromHAR( har, {
		queryComparison: ( requestValue, harValue, key, url ) => {
			if (
				'manage.wix.com' === url.host &&
				'/_api/communities-blog-node-api/_api/posts' === url.pathname
			) {
				if ( 'status' === key && requestValue !== harValue ) {
					// The values must match, so this is not ok.
					return false;
				}
			}

			// Parameters don't need to match.
			return true;
		},
	} );

	return await startExport( config );
}

module.exports = getWXRFromWixHAR;