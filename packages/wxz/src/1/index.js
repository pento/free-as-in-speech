/**
 * External dependencies
 */
const dayjs = require( 'dayjs' );
const utc = require( 'dayjs/plugin/utc' );
const { openDB, deleteDB } = require( 'idb/with-async-ittr-cjs' );
const { WritableStream } = require( 'web-streams-polyfill/ponyfill/es6' );
const Ajv = require( 'ajv' );
const debug = require( 'debug' )( 'wxz' );
const fflate = require( 'fflate' );
/**
 * Internal dependencies
 */
const schema = require( './schema' );
const objectSchemas = require( './objects' );

const WXZ_VERSION = '1.3';

dayjs.extend( utc );
/**
 * WXZ version 1.3 driver.
 */
class WXZDriver {
	constructor() {
		this.ajv = new Ajv( { removeAdditional: true } );
	}

	/**
	 * Connect to the DB.
	 *
	 * @param {boolean} reset Whether to reset the data store when connecting.
	 */
	async connect( { reset = false } = {} ) {
		// Extract the store name and index info from the schema.
		const storesNames = Object.keys( schema );

		if ( reset ) {
			// An error can sometimes be thrown if we're deleting a DB that doesn't
			// exist. Quickly opening and closing it avoids that issue.
			const handle = await openDB( 'WXZ1' );
			handle.close();

			await deleteDB( 'WXZ1' );
		}

		this.db = await openDB( 'WXZ1', 1, {
			upgrade: ( db ) => {
				storesNames.forEach( ( storeName ) => {
					const store = db.createObjectStore( storeName, {
						keyPath: 'internalId',
						autoIncrement: true,
					} );

					// If this store has indexes, add them to the store definition.
					if ( schema[ storeName ].indexes ) {
						schema[ storeName ].indexes.map( ( index ) =>
							store.createIndex( index, index )
						);
					}
				} );
			},
		} );
	}

	/**
	 * Given a blob of data, run it against the schema for the given dataType, then store it
	 * in the database.
	 *
	 * @param {string} dataType The type of data passed in the `data` blob.
	 * @param {Object} data     The data to store.
	 * @return {number} The autoincrement id of the data just stored.
	 */
	async storeData( dataType, data ) {
		// If we don't know about this dataType, bail.
		if ( ! schema[ dataType ] ) {
			return;
		}

		if ( dataType === 'objects' ) {
			return await this.storeObject( data.type, data.data );
		}

		const validatedData = {};

		// Go over each field in the schema, and validate it.
		schema[ dataType ].fields.forEach( ( field ) => {
			// If it's an empty field, set an empty value, then move on.
			if ( field.type === 'empty' ) {
				validatedData[ field.name ] = '';
				return;
			}

			// Skip any fields that have a filter which fails for this data blob.
			if ( field.filter && ! field.filter( data ) ) {
				return;
			}

			// If the field is read-only, get the default value.
			if ( field.hasOwnProperty( 'writeable' ) && ! field.writeable ) {
				validatedData[ field.name ] = field.default(
					validatedData,
					data
				);
				return;
			}

			let value;

			// Check if we have a value for this field, or fall back to the default value.
			if ( data.hasOwnProperty( field.name ) ) {
				value = data[ field.name ];
			} else if ( field.default ) {
				value = field.default( validatedData, data );
			}

			if ( value === undefined ) {
				return;
			}

			validatedData[ field.name ] = this.castValue( value, field.type );
		} );

		return await this.db.add( dataType, validatedData );
	}

	async storeObject( type, data ) {
		if ( ! objectSchemas.hasOwnProperty( type ) ) {
			return;
		}

		let validate = this.ajv.getSchema( type );
		if ( ! validate ) {
			this.ajv.addSchema( objectSchemas[ type ], type );
			validate = this.ajv.getSchema( type );
		}

		if ( ! validate( data ) ) {
			// Errors can be found in this.ajv.errors, see https://ajv.js.org/faq.html#ajv-api-for-returning-validation-errors
			return false;
		}

		return await this.db.add( 'objects', { type, data } );
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
				return dayjs.utc( value ).isValid()
					? dayjs.utc( value ).format( 'YYYY-MM-DD HH:mm:ss' )
					: '';
			case 'rfc2822_date':
				return dayjs.utc( value ).isValid()
					? dayjs
							.utc( value )
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
	 * @return {number} The internal ID of the post (this ID is not output to the WXZ file).
	 */
	async addPost( post ) {
		return await this.storeData( 'posts', post );
	}

	/**
	 * Add a comment to the export.
	 *
	 * @param {number} postId The internal ID of the post this comment belongs to.
	 * @param {Object} comment The comment object.
	 */
	addComment( postId, comment ) {
		this.storeData( 'comments', {
			...comment,
			post_id: postId,
		} );
	}

	/**
	 * Add a defined data object to the schema.
	 *
	 * @param {string} type The type of object to store.
	 * @param {Object} data The object data.
	 * @return {number} The object ID.
	 */
	async addObject( type, data ) {
		return await this.storeData( 'objects', { type, data } );
	}

	/**
	 * Generates the entire WXZ file, and returns it as a string.
	 *
	 * @return {Uint8Array} The WXZ file content.
	 */
	async export() {
		let buffer = new Uint8Array( 0 );

		const writableStream = new WritableStream( {
			write: ( chunk ) =>
				new Promise( ( resolve ) => {
					buffer = new Uint8Array( [ ...buffer, ...chunk ] );
					resolve();
				} ),
		} );

		await this.stream( writableStream );

		return buffer;
	}

	/**
	 * Given a WritableStream, generate the WXZ file, and write it to that stream.
	 *
	 * @param {WritableStream} writableStream The stream to write to.
	 */
	async stream( writableStream ) {
		const writer = writableStream.getWriter();
		const zip = new fflate.Zip( ( err, data, final ) => {
			if ( err ) {
				debug( 'Error:', err );
			} else if ( data ) {
				writer.ready
					.then( () => {
						return writer.write( data );
					} )
					.then( () => {
						debug( 'Chunk written to sink.' );
						if ( final ) {
							writer.ready
								.then( () => {
									writer.close();
								} )
								.then( () => {
									debug( 'All chunks written' );
								} )
								.catch( ( finalErr ) => {
									debug( 'Stream error:', finalErr );
								} );
						}
					} )
					.catch( ( dataErr ) => {
						debug( 'Chunk error:', dataErr );
					} );
			}
		} );

		const mimetype = new fflate.ZipPassThrough( 'mimetype' );
		zip.add( mimetype );
		mimetype.push(
			fflate.strToU8( 'application/vnd.wordpress.export+zip' ),
			true
		);

		const rename = ( item, from, to ) => {
			if ( from in item ) {
				item[ to ] = item[ from ];
				delete item[ from ];
			}
			return item;
		};

		const filterObject = ( obj, cb ) =>
			Object.fromEntries(
				Object.entries( obj ).filter( ( [ key, val ] ) =>
					cb( val, key )
				)
			);
		const removeEmptyFields = ( item ) =>
			filterObject( item, ( val ) => !! val );

		// We want to process each part of the schema in sequence. However, since the
		// processing function is asynchronous, we can't just use forEach(), as that will
		// move on as soon as the processing function is called, rather than waiting for it
		// to finish.
		//
		// Instead, we make use of reduce()'s behaviour, where it passes the result of the previous
		// function call to the next function. As the previous function call is asynchronous, we can
		// just wait for it to finish before proceeding.
		await Object.entries( schema ).reduce( async ( lock, [ store ] ) => {
			// Wait for the previous store processing to finish.
			await lock;
			await writer.ready;

			// We'll need to at least lock the current data store.
			const txStores = [ store ];

			if ( store === 'comments' ) {
				// Comments are handled inside individual posts, we can skip them.
				return;
			} else if ( store === 'posts' ) {
				// We're in posts, so we need to lock the comments data store, too.
				txStores.push( 'comments' );
			}

			// Start a transaction against the database.
			const tx = this.db.transaction( txStores );
			let file, filename;

			// Loop over every item in the current data store.
			for await ( const cursor of tx.objectStore( store ) ) {
				let datum = removeEmptyFields( cursor.value );
				datum.version = 1;
				datum.id = datum.id || datum.internalId;

				switch ( store ) {
					case 'siteMeta':
						filename = 'site/config.json';
						break;
					case 'authors':
						filename = 'users/' + datum.id + '.json';
						break;
					default:
						filename = store + '/' + datum.id + '.json';
				}

				delete datum.internalId;

				file = new fflate.ZipDeflate( filename );
				zip.add( file );

				if ( store === 'objects' ) {
					const objectType = datum.type;
					let output;
					if ( objectType === 'contact-form' ) {
						output = [];

						output.push( { email: datum.data.email } );
						for ( const field of datum.data.fields ) {
							const outputObject = {
								_name: 'field',
								_attrs: {
									...field,
								},
							};

							if ( field.type === 'select' ) {
								delete outputObject._attrs.options;

								outputObject._content = [];
								for ( const selectOption of field.options ) {
									outputObject._content.push( {
										_name: 'option',
										_attrs: {
											value: selectOption.value,
										},
										_content: selectOption.text,
									} );
								}
							}

							output.push( outputObject );
						}
						datum = output;
					} else {
						datum = datum.data;
					}
				} else if ( 'posts' === store ) {
					datum.sticky = !! datum.sticky;
					delete datum.link;
					delete datum.guid;
					datum.commentsOpen = 'open' === datum.comment_status;
					delete datum.comment_status;
					delete datum.date;
					datum = rename( datum, 'attachment_url', 'attachmentUrl' );
					datum = rename( datum, 'menu_order', 'menuOrder' );
					datum = rename( datum, 'status', 'postStatus' );
					datum = rename( datum, 'postDate', 'published' );
					if ( datum.published ) {
						datum.published = new Date( datum.published ).toJSON();
					}
					if ( datum.terms ) {
						datum.terms = datum.terms.map( ( term ) => term.id );
					}
					if ( datum.meta ) {
						datum.meta = datum.meta.map( ( meta ) => {
							return {
								key: String( meta.key ),
								value: String( meta.value ),
							};
						} );
					}
				}

				file.push( fflate.strToU8( JSON.stringify( datum ) ), true );
				debug( filename );
			}
		}, Promise.resolve( null ) );

		debug( 'zip.end' );

		writer.ready.then( () => {
			zip.end();
		} );

		await writer.closed;

		debug( 'zip.ended' );
	}
}

module.exports = {
	WXZ_VERSION,
	WXZDriver,
};
