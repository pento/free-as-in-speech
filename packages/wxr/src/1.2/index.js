/**
 * External dependencies
 */
const moment = require( 'moment' );
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

	/**
	 * Clear any data that's currently stored in the tables. This should usually be called
	 * when starting a new export, to ensure there's no residual data left from previous exports.
	 */
	clear() {
		return Promise.all(
			Object.keys( schema ).map( ( store ) => this.db.clear( store ) )
		);
	}

	/**
	 * Given a blob of data, run it against the schema for the given dataType, then store it
	 * in the database.
	 *
	 * @param {string} dataType The type of data passed in the `data` blob.
	 * @param {Object} data     The data to store.
	 */
	storeData( dataType, data ) {
		// If we don't know about this dataType, bail.
		if ( ! schema[ dataType ] ) {
			return;
		}

		const validatedData = {};

		// Go over each field in the schema, and validate it.
		schema[ dataType ].fields.forEach( ( field ) => {
			// If it's an empty field, set an empty value, then move on.
			if ( field.type === 'empty' ) {
				validatedData[ field.name ] = '';
				return;
			}

			// If the field is read-only, get the default value.
			if ( field.hasOwnProperty( 'writeable' ) && ! field.writeable ) {
				validatedData[ field.name ] = field.default( validatedData );
				return;
			}

			let value;

			// Check if we have a value for this field, or fall back to the default value.
			if ( data.hasOwnProperty( field.name ) ) {
				value = data[ field.name ];
			} else if ( field.default ) {
				value = field.default( validatedData );
			}

			if ( value === undefined ) {
				return;
			}

			validatedData[ field.name ] = this.castValue( value, field.type );
		} );

		this.db.add( dataType, validatedData );
	}

	/**
	 * Given a particular value, cast it to the passed type.
	 *
	 * The type is not necessarily a JavaScript data type: instead, these are particular types of data
	 * that we need to insert in the XHR file.
	 *
	 * @param {*}      value The value to be cast.
	 * @param {string} type  The type to cast the value as. Valid types are: 'string', 'int', 'mysql_date',
	 *                       'meta', and 'terms'.
	 */
	castValue( value, type ) {
		switch ( type ) {
			case 'string':
				return value.toString();
			case 'int':
				return parseInt( value );
			case 'number':
				return Number( value );
			case 'mysql_date':
				return moment( value ).isValid()
					? moment( value ).utc().format( 'YYYY-MM-DD HH:mm:ss' )
					: '';
			case 'rfc2822_date':
				return moment( value ).isValid()
					? moment( value )
							.utc()
							.format( 'ddd, DD MMM YYYY HH:mm:ss [GMT]' )
					: '';
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

	/**
	 * Given a WritableStream, generate the XHR file, and write it to that stream.
	 *
	 * @param {WritableStream} writableStream The stream to write to.
	 */
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
						if ( datum[ field.name ] === undefined ) {
							continue;
						}

						if ( field.element ) {
							await this.write( writer, '\t'.repeat( tabs ) );
							await this.write( writer, `<${ field.element }` );

							if ( field.attributes ) {
								for ( const attrKey in field.attributes ) {
									await this.write(
										writer,
										` ${ attrKey }="${ field.attributes[ attrKey ] }"`
									);
								}
							}

							await this.write( writer, '>' );
						}

						await this.write(
							writer,
							this.formatValue( datum[ field.name ], field, tabs )
						);

						if ( field.element ) {
							await this.write(
								writer,
								`</${ field.element }>\n`
							);
						}
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

	/**
	 * Format a given value for writing to the XHR file.
	 *
	 * @param {*}      value The value being written.
	 * @param {Object} field The field definition for the value.
	 * @param {number} tabs  The number of tabs to indent the value, for multiline values.
	 */
	formatValue( value, field, tabs ) {
		let xmlChunk = '';

		switch ( field.type ) {
			case 'string':
			case 'mysql_date':
			case 'rfc2822_date':
				return '<![CDATA[' + xmlSanitizer( value ) + ']]>';
			case 'meta':
				if ( value.length === 0 ) {
					return '';
				}

				for ( const meta of value ) {
					xmlChunk += '\t'.repeat( tabs );
					xmlChunk += `<${ field.childElement }>`;

					xmlChunk += '\n' + '\t'.repeat( tabs + 1 );
					xmlChunk +=
						'<wp:meta_key>' +
						xmlSanitizer( meta.key ) +
						'</wp:meta_key>';

					xmlChunk += '\n' + '\t'.repeat( tabs + 1 );
					xmlChunk +=
						'<wp:meta_value>' +
						xmlSanitizer( meta.value ) +
						'</wp:meta_value>';

					xmlChunk += '\n' + '\t'.repeat( tabs );
					xmlChunk += `</${ field.childElement }>\n`;
				}
				return xmlChunk;
			case 'terms':
				if ( value.length === 0 ) {
					return '';
				}

				for ( const term of value ) {
					xmlChunk += '\n' + '\t'.repeat( tabs + 1 );
					xmlChunk += `<category domain="${ term.type }" nicename="${ term.slug }">`;
					xmlChunk += '<![CDATA[' + xmlSanitizer( term.name ) + ']]>';
					xmlChunk += '</category>';
				}
				return xmlChunk + '\n';
			case 'int':
			case 'number':
				return value;
			case 'empty':
				return '';
			default:
				return xmlSanitizer( value );
		}
	}

	/**
	 * A little helper to wait for writable stream writer to be ready before writing to it.
	 *
	 * @param {WritableStreamDefaultWriter} writer  The writable stream writer.
	 * @param {string}                      content The content to write.
	 */
	async write( writer, content ) {
		await writer.ready;
		await writer.write( content );
	}

	/**
	 * Write the XHR file header to the write stream.
	 *
	 * @param {WritableStreamDefaultWriter} writer The writable stream writer.
	 */
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

	/**
	 * Write the XHR file footer to the write stream.
	 *
	 * @param {WritableStreamDefaultWriter} writer The writable stream writer.
	 */
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
