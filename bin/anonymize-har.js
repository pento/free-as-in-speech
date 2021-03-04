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

const now = dayjs();
const counter = ( () => {
	const counters = {};
	return ( key ) => {
		if ( undefined === counters[ key ] ) {
			counters[ key ] = 0;
		}
		return ++counters[ key ];
	};
} )();

const randBase62 = ( key ) => {
	let out = '';
	// This is not very strong but we need just something. Don't use for crypto.
	const c = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	for ( let i = key.length - 1; i > 0; i-- ) {
		out += c[ Math.floor( Math.random() * c.length ) ];
	}
	return out;
};

const randNum = ( num ) =>
	Math.floor( Math.random() * Math.pow( 10, Math.log10( num ) ) );

const valueRegex = ( key, flags ) => {
	return new RegExp(
		'(?:"name": "' +
			key +
			'",\\s+"value": "|\b' +
			key +
			'=)([a-zA-Z0-9._-]{4,})',
		flags
	);
};

let firstTime;
const anonymizers = {
	datetime: { // ISO 8601
		regex: /\b((?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:[.]\d{1,5})?(?:Z|[+-][01]\d:[0-5]\d))/g,
		replacement: ( m ) => {
			if ( ! firstTime ) {
				firstTime = dayjs( m );
			}
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
	_wixUIDX: {
		regex: /_wixUIDX=(\d+)/g,
		replacement: randNum,
	},
	mediaToken: {
		regex: /__MEDIA_TOKEN__ = '([^']+)/g,
		replacement: randBase62,
	},
	wixClient: {
		regex: /wixClient=(\d+)/g,
		replacement: randNum,
	},
	wixSession2: {
		regex: /wixSession2=(JWT[.][^&;]+)/g,
		replacement: randBase62,
	},
	siteToken: {
		regex: valueRegex( 'site_token', 'g' ),
		replacement: randBase62,
	},
	authorization: {
		regex: valueRegex( 'Authorization', 'gi' ),
		replacement: randBase62,
	},
	session_id: {
		regex: valueRegex( 'session_id', 'g' ),
		replacement: randBase62,
	},
};

const replacements = {};
const logReplacements = {};
Object.keys( anonymizers ).forEach(
	( key ) => ( logReplacements[ key ] = {} )
);

// Safe-guard well-defined variables by finding them in our source.
Object.entries( anonymizers ).forEach( ( anonymizer ) => {
	fileseek(
		path.join( __dirname, '../source/services' ),
		anonymizer[ 1 ].regex,
		( m ) => {
			replacements[ m ] = m;
			logReplacements[ anonymizer[ 0 ] ][ m ] = m;
		}
	);
} );

// Now let's do the actual work.
const infile = process.argv[ 2 ];
console.error( 'Reading ' + infile + '...' );
const file = fs.readFileSync( infile );

let anonymizedFile = file.toString();

Object.entries( anonymizers ).forEach(
	( anonymizer ) =>
		( anonymizedFile = anonymizedFile.replace(
			anonymizer[ 1 ].regex,
			( m, toAnonymize ) => {
				if ( undefined === replacements[ toAnonymize ] ) {
					replacements[ toAnonymize ] = anonymizer[ 1 ].replacement(
						toAnonymize
					);
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
				return m.replace( toAnonymize, replacements[ toAnonymize ] );
			}
		) )
);

// Let's replace all of our replacement strings again in case they are used elsewhere in the file.
Object.entries( replacements ).forEach(
	( replacement ) =>
		( anonymizedFile = anonymizedFile
			.split( replacement[ 0 ] )
			.join( replacement[ 1 ] ) )
);

// Display what was replaced.
console.error( 'The following number of items were replaced:' );
Object.entries( logReplacements ).forEach( ( category ) => Object.keys( category[1] ).length && console.log( category[0], Object.keys( category[1] ).length ) );
console.error( logReplacements );

const outfile = path.join(
	path.dirname( infile ),
	'anonymized-' + path.basename( infile )
);
fs.writeFileSync( outfile, anonymizedFile );
console.error( 'Wrote ' + outfile + '...' );
