/**
 * External dependencies
 */
const moment = require( 'moment' );

/**
 * Internal dependencies
 */
// const foo = require( './index.js' );
// console.log( foo );

module.exports = {
	siteMeta: {
		fields: [
			{
				name: 'title',
				type: 'string',
				element: 'title',
			},
			{
				name: 'link',
				type: 'string',
				element: 'link',
			},
			{
				name: 'description',
				type: 'string',
				element: 'description',
			},
			{
				name: 'pubDate',
				type: 'rfc2822_date',
				element: 'pubDate',
				default: () => moment.utc().toString(),
				writeable: false,
			},
			{
				name: 'language',
				type: 'string',
				element: 'language',
			},
			{
				name: 'wxrVersion',
				type: 'number',
				element: 'wp:wxr_version',
				default: () => 1.2,
				writeable: false,
			},
			{
				name: 'siteUrl',
				type: 'string',
				element: 'wp:base_site_url',
				default: ( data ) => data.link,
			},
			{
				name: 'blogUrl',
				type: 'string',
				element: 'wp:base_blog_url',
				default: ( data ) => data.link,
			},
		],
	},
	authors: {
		containerElement: 'wp:author',
		fields: [
			{
				name: 'id',
				type: 'int',
				element: 'wp:author_id',
			},
			{
				name: 'login',
				type: 'string',
				element: 'wp:author_login',
			},
			{
				name: 'email',
				type: 'string',
				element: 'wp:author_email',
			},
			{
				name: 'display_name',
				type: 'string',
				element: 'wp:author_display_name',
			},
			{
				name: 'first_name',
				type: 'string',
				element: 'wp:author_first_name',
			},
			{
				name: 'last_name',
				type: 'string',
				element: 'wp:author_last_name',
			},
		],
	},
	categories: {
		containerElement: 'wp:category',
		fields: [
			{
				name: 'id',
				type: 'int',
				element: 'wp:term_id',
			},
			{
				name: 'slug',
				type: 'string',
				element: 'wp:category_nicename',
			},
			{
				name: 'parent',
				type: 'string',
				element: 'wp:category_parent',
				default: () => '',
			},
			{
				name: 'name',
				type: 'string',
				element: 'wp:cat_name',
			},
			{
				name: 'description',
				type: 'string',
				element: 'wp:category_description',
			},
			{
				name: 'meta',
				type: 'meta',
				childElement: 'wp:term_meta',
			},
		],
	},
	tags: {
		containerElement: 'wp:tag',
		fields: [
			{
				name: 'id',
				type: 'int',
				element: 'wp:term_id',
			},
			{
				name: 'slug',
				type: 'string',
				element: 'wp:tag_slug',
			},
			{
				name: 'name',
				type: 'string',
				element: 'wp:tag_name',
			},
			{
				name: 'description',
				type: 'string',
				element: 'wp:tag_description',
			},
			{
				name: 'meta',
				type: 'meta',
				childElement: 'wp:term_meta',
			},
		],
	},
	terms: {
		containerElement: 'wp:term',
		fields: [
			{
				name: 'id',
				type: 'int',
				element: 'wp:term_id',
			},
			{
				name: 'taxonomy',
				type: 'string',
				element: 'wp:tag_taxonomy',
			},
			{
				name: 'slug',
				type: 'string',
				element: 'wp:term_slug',
			},
			{
				name: 'parent',
				type: 'string',
				element: 'wp:term_parent',
				default: () => '',
			},
			{
				name: 'name',
				type: 'string',
				element: 'wp:term_name',
			},
			{
				name: 'description',
				type: 'string',
				element: 'wp:term_description',
			},
			{
				name: 'meta',
				type: 'meta',
				childElement: 'wp:term_meta',
			},
		],
	},
	posts: {
		containerElement: 'item',
		fields: [
			{
				name: 'id',
				type: 'int',
				element: 'wp:post_id',
			},
			{
				name: 'title',
				type: 'string',
				element: 'title',
			},
			{
				name: 'link',
				type: 'string',
				element: 'link',
			},
			{
				name: 'date',
				type: 'rfc2822_date',
				element: 'pubDate',
			},
			{
				name: 'author',
				type: 'string',
				element: 'dc:creator',
			},
			{
				name: 'guid',
				type: 'string',
				element: 'guid',
				attributes: { isPermaLink: false },
			},
			{
				name: 'description',
				type: 'empty',
				element: 'description',
				writeable: false,
			},
			{
				name: 'content',
				type: 'string',
				element: 'content:encoded',
			},
			{
				name: 'excerpt',
				type: 'string',
				element: 'excerpt:encoded',
			},
			{
				name: 'postDate',
				type: 'mysql_date',
				element: 'wp:post_date',
				default: ( data ) => data.date,
			},
			{
				name: 'date_gmt',
				type: 'mysql_date',
				element: 'wp:post_date_gmt',
			},
			{
				name: 'modified',
				type: 'mysql_date',
				element: 'wp:post_modified',
			},
			{
				name: 'modified_gmt',
				type: 'mysql_date',
				element: 'wp:post_modified_gmt',
			},
			{
				name: 'comment_status',
				type: 'string',
				element: 'wp:comment_status',
				default: () => 'open',
			},
			{
				name: 'ping_status',
				type: 'string',
				element: 'wp:ping_status',
			},
			{
				name: 'post_name',
				type: 'string',
				element: 'wp:post_name',
			},
			{
				name: 'status',
				type: 'string',
				element: 'wp:status',
			},
			{
				name: 'parent',
				type: 'int',
				element: 'wp:post_parent',
			},
			{
				name: 'menu_order',
				type: 'int',
				element: 'wp:menu_order',
			},
			{
				name: 'type',
				type: 'string',
				element: 'wp:post_type',
			},
			{
				name: 'password',
				type: 'string',
				element: 'wp:post_password',
			},
			{
				name: 'sticky',
				type: 'int',
				element: 'wp:is_sticky',
				default: () => 0,
			},
			{
				name: 'attachment_url',
				type: 'string',
				element: 'wp:attachment_url',
			},
			{
				name: 'terms',
				type: 'terms',
			},
			{
				name: 'meta',
				type: 'meta',
				childElement: 'wp:postmeta',
			},
		],
	},
};
