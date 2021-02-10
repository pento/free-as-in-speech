/**
 * External dependencies
 */
const { openDB } = require( 'idb/with-async-ittr-cjs' );
const { WritableStream } = require( 'web-streams-polyfill/ponyfill/es6' );
const xmlSanitizer = require( 'xml-sanitizer' );

/**
 * Internal dependencies
 */
const schema = require( './schema' );

const WXR_VERSION = '1.2';

/**
 * WXR version 1.2 driver.
 */
class WXRDriver {
	/**
	 * Connect to the DB.
	 */
	async connect() {
		// Extract the store name and index info from the schema.
		const storesNames = Object.keys( schema );

		this.db = await openDB( 'WXR-1.2', 1, {
			upgrade: ( db ) => {
				storesNames.forEach( ( store ) => {
					db.createObjectStore( store, {
						keyPath: 'internalId',
						autoIncrement: true,
					} );
				} );
			},
		} );
	}

	clear() {
		return Promise.all(
			Object.keys( schema ).map( ( store ) => this.db.clear( store ) )
		);
	}

	storeData( dataType, data ) {
		if ( ! schema[ dataType ] ) {
			return;
		}

		const validatedData = {};

		schema[ dataType ].fields.forEach( ( field ) => {
			if ( field.hasOwnProperty( 'writeable' ) && ! field.writeable ) {
				validatedData[ field.name ] = field.default( validatedData );
			}

			let value;

			if ( data.hasOwnProperty( field.name ) ) {
				value = data[ field.name ];
			} else if ( field.default ) {
				value = field.default( validatedData );
			}

			if ( value === undefined ) {
				return;
			}

			if ( field.format ) {
				validatedData[ field.name ] = field.format( value );
			} else {
				validatedData[ field.name ] = this.castValue(
					value,
					field.type
				);
			}
		} );

		this.db.add( dataType, validatedData );
	}

	castValue( value, type ) {
		switch ( type ) {
			case 'string':
				return value.toString();
			case 'int':
				return parseInt( value );
			case 'meta':
				if ( ! Array.isArray( value ) ) {
					return [];
				}

				return value.filter( ( element ) => {
					if ( ! element.key || ! element.value ) {
						return false;
					}

					return true;
				} );
			case 'terms':
				if ( ! Array.isArray( value ) ) {
					return [];
				}

				return value.filter( ( element ) => {
					if ( ! element.type || ! element.slug || ! element.name ) {
						return false;
					}

					return true;
				} );
		}
	}

	/**
	 * Sets the site meta data.
	 *
	 * @param {Object} metaData The site meta data object.
	 */
	setSiteMeta( metaData ) {
		this.storeData( 'siteMeta', metaData );
	}

	/**
	 * Add a category to the export.
	 *
	 * @param {Object} category The category object.
	 */
	addCategory( category ) {
		this.storeData( 'categories', category );
	}

	/**
	 * Add a tag to the export.
	 *
	 * @param {Object} tag The tag object.
	 */
	addTag( tag ) {
		this.storeData( 'tags', tag );
	}

	/**
	 * Add a term to the export.
	 *
	 * @param {Object} term The term object.
	 */
	addTerm( term ) {
		this.storeData( 'terms', term );
	}

	/**
	 * Add an author to the export.
	 *
	 * @param {Object} author The author object.
	 */
	addAuthor( author ) {
		this.storeData( 'authors', author );
	}

	/**
	 * Add a post to the export.
	 *
	 * @param {Object} post The post object.
	 */
	addPost( post ) {
		this.storeData( 'posts', post );
	}

	async export() {
		let buffer = '';

		const writableStream = new WritableStream( {
			write: ( chunk ) =>
				new Promise( ( resolve ) => {
					buffer += chunk;
					resolve();
				} ),
		} );

		await this.stream( writableStream );

		return buffer;
	}

	async stream( writableStream ) {
		const writer = writableStream.getWriter();

		await writer.ready;

		await this.writeHeader( writer );

		let tabs = 1;

		await Object.entries( schema ).reduce(
			async ( lock, [ store, storeDef ] ) => {
				await lock;

				const tx = this.db.transaction( store );

				for await ( const cursor of tx.store ) {
					const datum = cursor.value;

					if ( storeDef.containerElement ) {
						await this.write( writer, '\t'.repeat( tabs ) );
						tabs++;

						await this.write(
							writer,
							`<${ storeDef.containerElement }>\n`
						);
					}

					for ( const field of storeDef.fields ) {
						if ( ! datum[ field.name ] ) {
							continue;
						}

						await this.write( writer, '\t'.repeat( tabs ) );
						await this.write( writer, `<${ field.element }` );

						if ( field.attributes ) {
							for ( const attrKey in field.attributes ) {
								await this.write(
									writer,
									` ${ attrKey }="${ field.attributes[ attrKey ] }`
								);
							}
						}

						await this.write( writer, '>' );

						await this.write(
							writer,
							this.formatValue(
								datum[ field.name ],
								field.type,
								tabs
							)
						);

						await this.write( writer, `</${ field.element }>\n` );
					}

					if ( storeDef.containerElement ) {
						tabs--;
						await this.write( writer, '\t'.repeat( tabs ) );

						await this.write(
							writer,
							`</${ storeDef.containerElement }>\n`
						);
					}
				}
			},
			Promise.resolve( null )
		);

		await this.writeFooter( writer );

		await writer.close();
	}

	formatValue( value, fieldType, tabs ) {
		switch ( fieldType ) {
			case 'string':
				return '<![CDATA[' + xmlSanitizer( value ) + ']]>';
			case 'meta':
				return '';
			case 'terms':
				let xmlChunk = '\n';
				for ( const term of value ) {
					xmlChunk += '\t'.repeat( tabs + 1 );
					xmlChunk += `<category domain="${ term.type }" nicename="${ term.slug }">`;
					xmlChunk += '<![CDATA[' + xmlSanitizer( term.name ) + ']]>';
					xmlChunk += '</category>\n';
				}
				return xmlChunk;
			default:
				return xmlSanitizer( value );
		}
	}

	async write( writer, content ) {
		// console.log( { content } );
		await writer.ready;
		await writer.write( content );
	}

	async writeHeader( writer ) {
		await this.write(
			writer,
			`<?xml version="1.0" encoding="UTF-8" ?>

<!-- This is a WordPress eXtended RSS file generated by the "Free (as in Speech)" browser extension, as an export of your site. -->
<!-- It contains information about your site's posts, pages, comments, categories, and other content. -->
<!-- You may use this file to transfer that content from one site to another. -->
<!-- This file is not intended to serve as a complete backup of your site. -->

<!-- To import this information into a WordPress site follow these steps: -->
<!-- 1. Log in to that site as an administrator. -->
<!-- 2. Go to Tools: Import in the WordPress admin panel. -->
<!-- 3. Install the "WordPress" importer from the list. -->
<!-- 4. Activate & Run Importer. -->
<!-- 5. Upload this file using the form provided on that page. -->
<!-- 6. You will first be asked to map the authors in this export file to users -->
<!--    on the site. For each author, you may choose to map to an -->
<!--    existing user on the site or to create a new user. -->
<!-- 7. WordPress will then import each of the posts, pages, comments, categories, etc. -->
<!--    contained in this file into your site. -->

<rss version="2.0"
	xmlns:excerpt="http://wordpress.org/export/${ WXR_VERSION }/excerpt/"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:wp="http://wordpress.org/export/${ WXR_VERSION }/"
>
<channel>
`
		);
	}

	async writeFooter( writer ) {
		await this.write(
			writer,
			`</channel>
</rss>`
		);
	}
}

module.exports = {
	WXR_VERSION,
	WXRDriver,
};
