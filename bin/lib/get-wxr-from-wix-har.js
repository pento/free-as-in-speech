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
		fallback: ( url, entry ) => {
			console.error( 'Missing URL in HAR:', url ); // eslint-disable-line no-console
			return entry;
		},
	} );

	// We're ignoring the status reports in these tests for now.
	const statusReport = () => {};

	return await startExport( config, statusReport );
}

module.exports = getWXRFromWixHAR;
