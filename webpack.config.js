/**
 * External dependencies
 */
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );

module.exports = {
	devtool: 'source-map',
	stats: 'errors-only',
	entry: {
		background: './source/background',
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
	plugins: [
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
