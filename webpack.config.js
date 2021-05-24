/**
 * External dependencies
 */
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { DefinePlugin } = require( 'webpack' );
const TerserPlugin = require( 'terser-webpack-plugin' );

module.exports = {
	devtool: 'source-map',
	stats: 'errors-only',
	target: 'node',
	entry: {
		background: './source/background',
		content: './source/content',
		action: './source/action',
		'@wordpress/wxr': './packages/wxr',
		'site-parsers': './packages/site-parsers',
		'gutenberg-for-node': './packages/gutenberg-for-node',
		'fetch-from-har': './packages/fetch-from-har',
	},
	output: {
		path: path.join( __dirname, 'distribution/build' ),
		filename: '[name].js',
	},
	externals: {
		canvas: 'commonjs canvas',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
		],
	},
	resolve: {
		fallback: {
			path: require.resolve( 'path-browserify' ),
			http: require.resolve( 'stream-http' ),
			https: require.resolve( 'https-browserify' ),
			stream: require.resolve( 'stream-browserify' ),
			crypto: require.resolve( 'crypto-browserify' ),
			zlib: require.resolve( 'browserify-zlib' ),
			os: require.resolve( 'os-browserify/browser' ),
		},
	},
	plugins: [
		new DefinePlugin( {
			'process.env.GUTENBERG_PHASE': JSON.stringify( 1 ),
			'process.env.COMPONENT_SYSTEM_PHASE': JSON.stringify( 0 ),
			'process.env.FORCE_REDUCED_MOTION': JSON.stringify(
				!! process.env.FORCE_REDUCED_MOTION || false
			),
		} ),
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: '**/*',
					context: 'source',
					globOptions: {
						ignore: [ '*.js' ],
					},
				},
				{
					from:
						'node_modules/webextension-polyfill/dist/browser-polyfill.js',
					to: 'polyfills/webextension.js',
				},
				{
					from: 'node_modules/web-streams-polyfill/dist/ponyfill.js',
					to: 'polyfills/web-streams.js',
				},
			],
		} ),
	],
	optimization: {
		minimizer: [
			new TerserPlugin( {
				terserOptions: {
					mangle: false,
					compress: false,
					output: {
						beautify: true,
						indent_level: 2, // eslint-disable-line camelcase
					},
				},
			} ),
		],
	},
};
