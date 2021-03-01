const communitiesBlogApp = require( './communities-blog-app' );
const easyBlogApp = require( './easy-blog-app' );
const mediaManagerSettings = require( './media-manager' );
const staticPages = require( './static-pages' );

/**
 * An array of the defined extractors.
 */
module.exports = [
	communitiesBlogApp,
	mediaManagerSettings,
	easyBlogApp,
	staticPages,
];
