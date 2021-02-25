/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;

// Finds all packages which are transpiled with Babel to force Jest to use their source code.
const transpiledPackageNames = glob( 'packages/*/src/index.js' ).map(
	( fileName ) => fileName.split( '/' )[ 1 ]
);

module.exports = {
	rootDir: '.',
	moduleNameMapper: {
		[ `@wordpress\\/(${ transpiledPackageNames.join(
			'|'
		) })$` ]: 'packages/$1/src',
	},
	preset: '@wordpress/jest-preset-default',
	setupFiles: [ 'fake-indexeddb/auto', './test/setup-env.js' ],
	testURL: 'http://localhost',
	testPathIgnorePatterns: [
		'/.git/',
		'/node_modules/',
		'<rootDir>/.*/build/',
		'<rootDir>/.*/build-module/',
		'<rootDir>/test/setup-env.js',
	],
	watchPlugins: [
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
};
