const services = require( '../../source/services' );

async function getWXRFromWixHAR( fetchFromHAR, har, config ) {
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
			console.error( 'Not Found', url ); // eslint-disable-line no-console
			const u = new URL( url );
			entry.response.content.text = '[]';
			// an example of how to hard-code a fallback, this will only be used if the HAR doesn't have such an entry.
			if (
				u.pathname === '/_api/communities-blog-node-api/v2/tags/query'
			) {
				entry.response.status = 200;
				entry.response.statusText = 'OK';
				entry.response.content.text = '{"tags":[]}';
			} else if (
				u.pathname === '/_serverless/dashboard-site-details/widget-data'
			) {
				entry.response.status = 200;
				entry.response.statusText = 'OK';
				entry.response.content.text = '{"quickActionsData":[]}';
			} else if ( u.pathname === '/go/site/media/files/list' ) {
				entry.response.status = 200;
				entry.response.statusText = 'OK';
				entry.response.content.text = '{"files":[]}';
			}

			return entry;
		},
	} );

	return await services.startExport( 'wix', config );
}

module.exports = getWXRFromWixHAR;
