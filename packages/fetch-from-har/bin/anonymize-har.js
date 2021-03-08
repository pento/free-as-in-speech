/**
 * Usage: anonymize-har.js <harfile>
 *
 * This will replace identifiers from a HAR file, trying to anonymize it.
 *
 */

/* eslint no-console: 0 */
const fs = require( 'fs' );
const path = require( 'path' );
const dayjs = require( 'dayjs' );
const { v4: uuidv4 } = require( 'uuid' );

const fileseek = ( directory, regex, callback ) => {
	directory = path.normalize( directory );

	fs.readdirSync( directory ).forEach( ( file ) => {
		const current = path.join( directory, file );

		if ( fs.lstatSync( current ).isDirectory() ) {
			return fileseek( current, regex, callback );
		}

		fs.readFileSync( current ).toString().replace( regex, callback );
	} );
};

// This maintains several counters for different keys.
const counter = ( () => {
	const counters = {};
	return ( key ) => {
		if ( undefined === counters[ key ] ) {
			counters[ key ] = 0;
		}
		return ++counters[ key ];
	};
} )();

// This is very basic but we'd like to create a random string of the same length. Don't use for crypto.
const randomBase62String = ( key ) => {
	let out = '';
	const c = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	for ( let i = key.length - 1; i > 0; i-- ) {
		out += c[ Math.floor( Math.random() * c.length ) ];
	}
	return out;
};

// Create a new random number of a similar length.
const randomNumber = ( num ) =>
	Math.floor( Math.random() * Math.pow( 10, 1 + Math.log10( num ) ) );

// This covers variables used as URL parameters and as cookies.
const valueRegex = ( key, flags, value ) => {
	return new RegExp(
		'(?:"name": "' +
			key +
			'",\\s+"value": "|\b' +
			key +
			'=)(' +
			( value || '[a-zA-Z0-9._-]{4,}' ) +
			')',
		flags
	);
};

const now = dayjs();
let firstTime;

const anonymizers = {
	timestamp: {
		// ISO 8601
		regex: /\b((?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:[.]\d{1,5})?(?:Z|[+-][01]\d:[0-5]\d))/g,
		replacement: ( m ) => {
			if ( ! firstTime ) {
				firstTime = dayjs( m );
			}
			// To maintain the timing between the events, we're calculating the relative timestamps here.
			return now.subtract( firstTime.diff( m ), 'ms' ).toISOString();
		},
	},
	ipv4: {
		regex: /"((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))"/g,
		replacement: () => {
			return '127.0.0.' + counter( 'ipv4' );
		},
	},
	ipv6: {
		regex: /"(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,})"/g,
		replacement: () => {
			return '::' + counter( 'ipv6' );
		},
	},
	email: {
		regex: /\b((?:[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z](?:[a-z0-9-]*[a-z])?))/g,
		replacement: () => {
			return 'example' + counter( 'email' ) + '@example.com';
		},
	},
	defaultUUID: {
		regex: /(([0-9a-fA-F])\2{7}-\2{4}-\2{4}-\2{4}-\2{10}[0-9a-fA-F]{2})/g,
		replacement: ( m ) => m,
	},
	uuid: {
		regex: /\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g,
		replacement: uuidv4,
	},
	wixSite: {
		regex: /(?:\/|u002F)([a-z0-9]+)[.]wixsite[.]com/gi,
		replacement: randomNumber,
	},
	_wixUIDX: {
		regex: /_wixUIDX=(\d+)/g,
		replacement: randomNumber,
	},
	mediaToken: {
		regex: /__MEDIA_TOKEN__ = '([^']+)/g,
		replacement: randomBase62String,
	},
	_wixAB3: {
		regex: /_wixAB3=([^&;]+)/g,
		replacement: randomBase62String,
	},
	googleAnalytics: {
		regex: /_ga=([^&;]+)/g,
		replacement: randomBase62String,
	},
	googleTagManager: {
		regex: /_gcl_au=([^&;]+)/g,
		replacement: randomBase62String,
	},
	wixClient: {
		regex: /wixClient=(\d+)/g,
		replacement: randomNumber,
	},
	wixSession2: {
		regex: /wixSession2=(JWT[.][^&;]+)/g,
		replacement: randomBase62String,
	},
	svSession: {
		regex: /svSession=([^&;]+)/g,
		replacement: randomBase62String,
	},
	xsrfToken: {
		regex: /XSRF-TOKEN=([^&;]+)/g,
		replacement: randomBase62String,
	},
	tsToken: {
		regex: /TS[0-9a-f]+=([^&;]+)/g,
		replacement: randomBase62String,
	},
	siteToken: {
		regex: valueRegex( 'site_token', 'g' ),
		replacement: randomBase62String,
	},
	authorization: {
		regex: valueRegex( 'Authorization', 'gi' ),
		replacement: randomBase62String,
	},
	session_id: {
		regex: valueRegex( 'session_id', 'g' ),
		replacement: randomBase62String,
	},
	request_id: {
		regex: valueRegex( 'x-wix-request-id', 'g' ),
		replacement: randomBase62String,
	},
	userAgent: {
		regex: valueRegex( 'User-Agent', 'g', '[^"]+' ),
		replacement: () => 'Mozilla',
	},
};

const replacements = {};

// This object logs replacements for user output later.
const logReplacements = {};
Object.keys( anonymizers ).forEach(
	( key ) => ( logReplacements[ key ] = {} )
);

// Safe-guard well-defined variables by finding them in our source.
Object.keys( anonymizers ).forEach( ( regex ) => {
	fileseek(
		path.join( __dirname, '../../../source/services' ),
		regex,
		( m ) => {
			replacements[ m ] = m;
		}
	);
} );

// Now let's do the actual work.
const infile = process.argv[ 2 ];
console.error( 'Reading ' + infile + '...' );
const file = fs.readFileSync( infile );

let anonymizedFile = file.toString();

Object.entries( anonymizers ).forEach( ( anonymizer ) => {
	anonymizedFile = anonymizedFile.replace(
		anonymizer[ 1 ].regex,
		( m, toAnonymize ) => {
			if ( undefined === replacements[ toAnonymize ] ) {
				// We'll want to replace a value with the same value throughout the file.
				replacements[ toAnonymize ] = anonymizer[ 1 ].replacement(
					toAnonymize
				);

				// We're keeping a separate object to output these later.
				if ( replacements[ toAnonymize ] !== toAnonymize ) {
					if (
						typeof replacements[ toAnonymize ] === 'string' &&
						replacements[ toAnonymize ].length > 43
					) {
						logReplacements[ anonymizer[ 0 ] ][
							toAnonymize.substr( 0, 40 ) + '...'
						] = replacements[ toAnonymize ].substr( 0, 40 ) + '...';
					} else {
						logReplacements[ anonymizer[ 0 ] ][ toAnonymize ] =
							replacements[ toAnonymize ];
					}
				}
			}

			return m.replace( toAnonymize, replacements[ toAnonymize ] );
		}
	);
} );

// Let's replace all of our replacement strings again in case they are used elsewhere in the file.
Object.entries( replacements ).forEach( ( replacement ) => {
	anonymizedFile = anonymizedFile
		.split( replacement[ 0 ] )
		.join( replacement[ 1 ] );
} );

// Display what was replaced.
console.error( 'The following number of items were replaced:' );
Object.entries( logReplacements ).forEach(
	( category ) =>
		Object.keys( category[ 1 ] ).length &&
		console.log( ' -', Object.keys( category[ 1 ] ).length, category[ 0 ] )
);
// console.error( logReplacements ); // For debugging you might want to see the full list of replacements.

const outfile = path.join(
	path.dirname( infile ),
	'anonymized-' + path.basename( infile )
);
fs.writeFileSync( outfile, anonymizedFile );
console.error( 'Wrote ' + outfile + '.' );
