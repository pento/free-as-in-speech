/**
 * External dependencies
 */
import moment from 'moment';
import { create } from 'xmlbuilder2';

const DATE_RFC2822 = 'ddd, DD MMM YYYY HH:mm:ss [GMT]';
const DATE_MYSQL = 'YYYY-MM-DD HH:mm:ss';

/**
 * Main WXR class.
 */
export default class WXR {
	/**
	 * Constructor.
	 */
	constructor() {
		this.wxr = create();

		this.addHeader();

		this.channel = this.wxr
			.ele( 'rss', {
				version: '2.0',
				'xmlns:excerpt': 'http://wordpress.org/export/1.2/excerpt/',
				'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
				'xmlns:wfw': 'http://wellformedweb.org/CommentAPI/',
				'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
				'xmlns:wp': 'http://wordpress.org/export/1.2/',
			} )
			.ele( 'channel' );

		this.channel
			.ele( 'pubDate' )
			.txt( moment.utc().format( DATE_RFC2822 ) );
		this.channel.ele( 'wp:wxr_version' ).txt( '1.2' );
	}

	/**
	 * Adds instruction comments to the WXR file.
	 */
	addHeader() {
		const instructions = [
			'This is a WordPress eXtended RSS file generated by the "Free as in Speech" browser extension, as an export of your site.',
			"It contains information about your site's posts, pages, comments, categories, and other content.",
			'You may use this file to transfer that content from one site to another.',
			'This file is not intended to serve as a complete backup of your site.',
			'',
			'To import this information into a WordPress site follow these steps:',
			'1. Log in to that site as an administrator.',
			'2. Go to Tools: Import in the WordPress admin panel.',
			'3. Install the "WordPress" importer from the list.',
			'4. Activate & Run Importer.',
			'5. Upload this file using the form provided on that page.',
			'6. You will first be asked to map the authors in this export file to users',
			'   on the site. For each author, you may choose to map to an',
			'   existing user on the site or to create a new user.',
			'7. WordPress will then import each of the posts, pages, comments, categories, etc.',
			'   contained in this file into your site.',
		];

		instructions.forEach( ( instruction ) =>
			this.wxr.com( ` ${ instruction } ` )
		);
	}

	/**
	 * Sets the site meta data.
	 *
	 * @param {Object} metaData The site meta data object.
	 */
	setSiteMeta( metaData ) {
		// Define the site meta properties that can be passed, and what XML elements they map to.
		const metaMap = [
			{
				key: 'title',
				elements: [ 'title' ],
			},
			{
				key: 'description',
				elements: [ 'description' ],
			},
			{
				key: 'language',
				elements: [ 'language' ],
			},
			{
				key: 'siteUrl',
				elements: [ 'wp:base_site_url' ],
			},
			{
				key: 'blogUrl',
				elements: [ 'link', 'wp:base_blog_url' ],
			},
		];

		// Set the corresponding XML elements for any meta data passed.
		metaMap.forEach( ( metaDef ) => {
			if ( metaData.hasOwnProperty( metaDef.key ) ) {
				metaDef.elements.forEach( ( element ) =>
					this.channel.ele( element ).txt( metaData[ metaDef.key ] )
				);
			}
		} );
	}

	/**
	 * Add an author to the export.
	 *
	 * @param {Object} author The author object.
	 */
	addAuthor( author ) {
		const keys = [
			'id',
			'login',
			'email',
			'display_name',
			'first_name',
			'last_name',
		];

		const authorEl = this.channel.ele( 'wp:author' );

		keys.forEach( ( key ) => {
			if ( author.hasOwnProperty( key ) ) {
				authorEl.ele( `wp:author_${ key }` ).txt( author[ key ] );
			}
		} );
	}

	/**
	 * Add a post to the export.
	 *
	 * @param {Object} post The post object.
	 */
	addPost( post ) {
		const dataFilters = [
			{
				key: 'id',
				element: 'wp:post_id',
				filter: ( data ) => parseInt( data ),
			},
			{
				key: 'title',
				element: 'title',
				filter: ( data ) => data.toString(),
			},
			{
				key: 'link',
				element: 'link',
				filter: ( data ) => data.toString(),
			},
			{
				key: 'date',
				element: 'pubDate',
				filter: ( data ) =>
					moment( data ).isValid()
						? moment( data ).utc().format( DATE_RFC2822 )
						: '',
			},
			{
				key: 'author',
				element: 'dc:creator',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
			{
				key: 'guid',
				element: 'guid',
				attributes: { isPermaLink: false },
				filter: ( data ) => data.toString(),
			},
			{
				key: 'content',
				element: 'content:encoded',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
			{
				key: 'excerpt',
				element: 'excerpt:encoded',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
			{
				key: 'date',
				element: 'wp:post_date',
				cdata: true,
				filter: ( data ) =>
					moment( data ).isValid()
						? moment( data ).utc().format( DATE_MYSQL )
						: '',
			},
			{
				key: 'date',
				element: 'wp:post_date_gmt',
				cdata: true,
				filter: ( data ) =>
					moment( data ).isValid()
						? moment( data ).utc().format( DATE_MYSQL )
						: '',
			},
			{
				key: 'status',
				element: 'wp:status',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
			{
				key: 'type',
				element: 'wp:post_type',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
			{
				key: 'sticky',
				element: 'wp:is_sticky',
				filter: ( data ) => parseInt( data ),
			},
			{
				key: 'comment_status',
				element: 'wp:comment_status',
				cdata: true,
				filter: ( data ) => data.toString(),
			},
		];

		const postEl = this.channel.ele( 'item' );

		dataFilters.forEach( ( filter ) => {
			if ( post.hasOwnProperty( filter.key ) ) {
				const data = filter.filter( post[ filter.key ] );
				if ( filter.cdata ) {
					postEl.ele( filter.element, filter.attributes ).dat( data );
				} else {
					postEl.ele( filter.element, filter.attributes ).txt( data );
				}
			}
		} );
	}

	/**
	 * Serialises the export into WXR XML.
	 */
	export() {
		return this.wxr.end( {
			allowEmptyTags: true,
			indent: '\t',
			prettyPrint: true,
		} );
	}
}
