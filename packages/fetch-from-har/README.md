# Fetch from HAR

This is a package for using a HAR file to fulfill HTTP requests without making a real request on the network.

## Basic usage

The package only exposes one method that acts as a generator of a function that can be used as a replacement for [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API):

```javascript
// @param  har  object  The JSON representing the HAR file (you need to run JSON.parse() on the string)
window.fetch = fetchFromHAR( har, {
	// When multiple matching requests (for method + hostname + pathname)
	// exist, we'll compare the GET parameters using this callback
	// to select the desired one.
	queryComparison: ( requestValue, harValue, key, url ) => {
		if ( '/index' === url.pathname ) {
			if ( 'status' === key && requestValue !== harValue ) {
				// The values for the GET parameter "status" must be equal,
				// so this mismatch means the request shouldn't match.
				return false;
			}
		}

		// A mismatch of the GET parameter values don't need to match.
		return true;
	},

	// When no matching request can be found in the HAR, this callback will
	// be invoked.
	fallback: ( url, entry ) => {
		// Can be used for logging missing URLs:
		debug( 'Missing URL in HAR:', url );

		// But also to provide fallback responses:
		const u = new URL( url );
		if ( u.pathname === '/tags' ) {
			entry.response.status = 200;
			entry.response.statusText = 'OK';
			entry.response.content.text = '{"tags":[]}';
		}

		return entry;
	},
} );

// Example invocation:
window
	.fetch( 'http://example.com/tags' )
	.then( ( result ) => result.json() )
	.then( ( text ) => debug );
```

## `queryComparison` Callback

```javascript
const queryComparison = ( requestValue, harValue, key, url ) => {};
```

This will be called for each GET parameter of a `fetch()` request, if more than one request in the HAR file matches the requested `method`, `hostname`, and `pathname`.

For a request to be considered, each of the requested GET parameters must receive a truthy return value from the callback.

If the callback is omitted any combination of parameter values is considered acceptable.

### `queryComparison` Parameters

-   `key` the name of the GET parameter.
-   `requestValue` the value that has been requested in the `fetch()` call.
-   `harValue` a request in the HAR file is available with this value (it might match, or not).
-   `url` a `URL` object of the whole URL that was requested via `fetch()`

### `queryComparison` Return value

`true` or `false`: whether the entry in the HAR file qualifies as a desired response.

## `fallback` Callback

```javascript
const fallback = ( url, entry ) => {};
```

This will be called if the request cannot be fulfilled with the requests available in the specified HAR object. This acts as a filter to allow the modification of the incoming `entry` value.

If the callback is omitted, then a 404 response will be generated.

### `fallback` Parameters

-   `url` the string value of the URL that was requested via `fetch()`
-   `entry` a generated 404 entry that would be returned.

### `fallback` Return value

The HAR entry to be used for a response. The incoming `entry` parameter can be used as a template and only override the desired values.
