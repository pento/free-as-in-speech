const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		browser: 'readonly',
		Blob: 'readonly',
		i18n: 'readonly',
		WritableStreamDefaultWriter: 'readonly',
	},
	rules: {
		'@wordpress/no-global-event-listener': 'off',
	},
};

module.exports = eslintConfig;
