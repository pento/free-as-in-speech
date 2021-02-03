// Code adapted from https://github.com/toutpt/har-express
const fs = require( 'fs' );

/**
 * parse take the path to looking for HAR files and return HAR structure
 *
 * @param {string} path
 */
function parse( path ) {
	let HAR = {
		log: {
			entries: [],
		},
	};
	try {
		HAR = JSON.parse( fs.readFileSync( path ) );
	} catch ( e ) {
		// console.error( e );
	}
	HAR.log.entries.forEach( ( e ) => {
		e.request.url = new URL( e.request.url );
	} );
	return HAR;
}

/**
 * filter request on method and path.
 * Note if it find more than one results it will try to be more restrictive
 * using queryString and body payload.
 *
 * @param {Object} HAR
 * @param {string} requestUrl
 * @param {Object} options
 */
function filter( HAR, requestUrl, options ) {
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
				return req.searchParams.get( qs.name ) === qs.value;
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

export const loadHar = function ( file, fetchMock ) {
	const HAR = parse( file );
	if ( ! HAR.log.entries ) {
		return HAR;
	}
	// console.log( 'Loaded HAR with these URLs: ' );
	// HAR.log.entries.forEach( e => console.log( '-', e.request.url.href ) );

	fetchMock.mock(
		function ( url, options ) {
			const entries = filter( HAR, url, options );
			return entries.length;
		},
		function ( url, options ) {
			const entries = filter( HAR, url, options );
			const res = entries[ 0 ].response;
			const headers = new fetchMock.config.Headers();
			res.headers.forEach( function ( h ) {
				headers.append( h.name, h.value );
			} );
			return new fetchMock.config.Response( res.content.text, {
				status: res.status,
				statusText: res.statusText,
				headers,
			} );
		}
	);

	return HAR;
};
