const cheerio = require( 'cheerio' );
const { v4: uuidv4 } = require( 'uuid' );
const { pasteHandler, serialize } = require( '@wordpress/blocks' );

const fetchPage = ( topology ) => ( page ) => {
	return window.fetch(
		topology.replace(
			'{filename}',
			page.pageJsonFileName
			)
		)
		.then( result => result.json() )
		.then( ( json, err ) => {
			if ( err ) {
				reject( err );
				return;
			}

			page.config = json;
			page.data = page.config.structure.components.map( component => {
				if ( ! component.dataQuery ) {
					return null;
				}
				return page.config.data.document_data[ component.dataQuery.replace( /^#/, '' ) ];
			} );
			return page;
		}
	);
}

module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	 appDefinitionId: 'static-pages',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	 extract: async ( config ) => {
	 	const url = new URL(
	 		'https://manage.wix.com/editor/' + config.metaSiteId
	 		);
	 	url.searchParams.set( 'editorSessionId', uuidv4() );
	 	url.searchParams.set( 'referralInfo', 'my-account' );

	 	let editorUrl;
	 	const metaConfigurations = await window
	 	.fetch( url, {
	 		credentials: 'include',
	 		referrer:
	 		'https://manage.wix.com/dashboard/' +
	 		config.metaSiteId +
	 		'/home?referralInfo=my-sites',
	 		mode: 'same-origin',
	 		headers: {
	 			Accept:
	 			'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	 			'Upgrade-Insecure-Requests': 1,
	 		},
	 	} )
	 	.then( ( result ) => {
	 		editorUrl = result.url;
	 		return result.text();
	 	} )
	 	.then( ( html ) => {
	 		const configData = {};

	 		const $ = cheerio.load( html );
	 		$( 'script' ).each( ( idx, scriptTag ) => {
	 			const currentTag = $( scriptTag );

	 			if ( currentTag.attr( 'src' ) !== undefined ) {
	 				return;
	 			}

	 			const vars = currentTag.html().split( /\s*var\s/ );
	 			const metaConfigurationRegExp = /^(siteHeader|editorModel)\s*=\s*(.*)$/g;

	 			for ( let i = 0; i < vars.length; i++ ) {
	 				let match;
	 				if (
	 					( match = metaConfigurationRegExp.exec(
	 						vars[ i ]
	 						) )
	 					) {
	 					const metaName = match[ 1 ];
	 				const metaConfigRawJSON = match[ 2 ].replace(
	 					/[;\s]+$/,
	 					''
	 					);
	 				configData[ metaName ] = JSON.parse(
	 					metaConfigRawJSON
	 					);
	 			}
	 		}
	 	} );

	 		return configData;
	 	} );

	 	return await Promise.all( metaConfigurations.siteHeader.pageIdList.pages.map( fetchPage( metaConfigurations.siteHeader.pageIdList.topology[ 0 ] ) ) );
	 },

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		data.forEach( ( post ) => {
			wxr.addPost( {
				title: post.title,
				content: pasteHandler( { HTML: post.data.map( item => item && item.text || '' ).join(''), mode: 'BLOCKS' } )
					.filter( ( blockContent ) => blockContent !== false )
					.map( ( wpBlock ) => serialize( wpBlock ) )
					.join( '\n\n' ),
				status: 'publish',
				sticky: 0,
				type: 'page',
				comment_status: 'closed',
			} );
		} );
	},
};
