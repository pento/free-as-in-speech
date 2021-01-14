const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		browser: 'readonly',
	},
};

module.exports = eslintConfig;
