const eslintConfig = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended-with-formatting',
	],
	globals: {
		browser: 'readonly',
	},
	rules: {
		'jsdoc/require-jsdoc': 'error',
		'jsdoc/require-param-description': 'error',
		'jsdoc/require-returns': 'error',
	},
};

module.exports = eslintConfig;
