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
	entry: {
		background: './source/background',
		content: './source/content',
		popup: './source/popup',
		'@wordpress/wxr': './packages/wxr',
	},
	output: {
		path: path.join( __dirname, 'distribution/build' ),
		filename: '[name].js',
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
						'node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
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
