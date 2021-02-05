/**
 * find the request in the HAR.
 *
 * @param {Object} HAR
 * @param {string} requestUrl
 * @param {Object} options
 */
function findRequestInHar( HAR, requestUrl, options ) {
	const queryComparison =
		options && 'function' === typeof options.queryComparison
			? options.queryComparison
			: ( requestValue, harValue ) => requestValue === harValue;
	const req = new URL( requestUrl );
	// lets do a first pass on it.
	const entries = HAR.log.entries.filter( ( e ) => {
		const u = e.request.url;
		if ( u.host !== req.host ) {
			return false;
		}
		if ( u.pathname !== req.pathname ) {
			return false;
		}
		if (
			options &&
			options.method &&
			e.request.method !== ( options.method || 'GET' )
		) {
			return false;
		}
		return true;
	} );

	if ( entries.length > 1 ) {
		let results = entries;
		// first lets filter on query params
		const withSameQueryString = entries.filter( ( e ) => {
			return e.request.queryString.every( ( qs ) => {
				return queryComparison(
					req.searchParams.get( qs.name ),
					qs.value,
					qs.name,
					e.request.url
				);
			} );
		} );
		if ( withSameQueryString.length > 0 ) {
			results = withSameQueryString;
		}
		if ( results.length > 1 && req.body ) {
			// then try to filter on body
			const withTheSameBody = entries.filter( ( e ) => {
				const data = e.request.postData;
				if ( data ) {
					return req.body === data.text;
				}
				return false;
			} );
			if ( withTheSameBody.length > 0 ) {
				results = withTheSameBody;
			}
		}
		return results;
	}
	return entries;
}

function fetchFromHAR( HAR, mockOptions ) {
	if (
		typeof HAR.log === 'undefined' ||
		typeof HAR.log.entries === 'undefined'
	) {
		HAR.log = { entries: {} };
	}

	HAR.log.entries.forEach( ( e ) => {
		e.request.url = new URL( e.request.url );
	} );

	return function ( url, options ) {
		return new Promise( ( resolve ) => {
			const entries = findRequestInHar(
				HAR,
				url,
				Object.assign( options, mockOptions )
			);
			let entry = {
				request: {
					url,
				},
				response: {
					status: 404,
					statusText: 'Not Found',
					content: {
						text: '',
					},
				},
			};
			if ( ! entries.length ) {
				if ( options && 'function' === typeof options.fallback ) {
					entry = options.fallback( url, entry );
				}
			} else {
				entry = entries[ 0 ];
			}

			const request = entry.request;
			const response = entry.response;
			resolve( {
				ok: ( response.status / 100 || 0 ) === 2, // 200-299
				statusText: response.statusText,
				status: response.status,
				url: response.redirectURL || request.url,
				text: () => Promise.resolve( response.content.text ),
				json: () =>
					Promise.resolve( response.content.text ).then( JSON.parse ),
				blob: () =>
					Promise.resolve( new Blob( [ response.content.text ] ) ),
				clone: response,
				headers: {
					keys: () =>
						response.headers.map( ( header ) => header.name ),
					entries: () =>
						response.headers.map( ( header ) => [
							header.name,
							header.value,
						] ),
					get: ( n ) => response.headers[ n.toLowerCase() ],
					has: ( n ) => n.toLowerCase() in response.headers,
				},
			} );
		} );
	};
}

module.exports = fetchFromHAR;
