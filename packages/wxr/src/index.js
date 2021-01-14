/**
 * External dependencies
 */
import { create } from 'xmlbuilder2';

export default class WXR {
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

		const now = new Date();
		this.channel.ele( 'pubDate' ).txt( now.toUTCString() );
		this.channel.ele( 'wp:wxr_version' ).txt( '1.2' );
	}

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

	setMeta( metaData ) {
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

	export() {
		return this.wxr.end( {
			allowEmptyTags: true,
			indent: '\t',
			prettyPrint: true,
		} );
	}
}
