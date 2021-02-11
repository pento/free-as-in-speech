const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		browser: 'readonly',
		Blob: 'readonly',
		WritableStreamDefaultWriter: 'readonly',
	},
	rules: {
		'@wordpress/no-global-event-listener': 'off',
	},
};

module.exports = eslintConfig;
