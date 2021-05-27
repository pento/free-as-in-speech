const cheerio = require( 'cheerio' );
const IdFactory = require( 'site-parsers' ).utils.IdFactory;

const extractConfigData = ( html ) => {
	const configData = {};

	// The configuration data is embedded in script tags in the HTML.
	const $ = cheerio.load( html );
	$( 'script' ).each( ( idx, scriptTag ) => {
		const currentTag = $( scriptTag );

		if ( currentTag.attr( 'src' ) !== undefined ) {
			return;
		}

		const vars = currentTag.html().split( /\s*var\s/ );
		const metaConfigurationRegExp = /^(siteHeader|editorModel|serviceTopology)\s*=\s*(.*)$/;

		for ( let i = 0; i < vars.length; i++ ) {
			let match;
			if ( ( match = metaConfigurationRegExp.exec( vars[ i ] ) ) ) {
				const metaName = match[ 1 ];
				const metaConfigRawJSON = match[ 2 ].replace( /[;\s]+$/, '' );
				configData[ metaName ] = JSON.parse( metaConfigRawJSON );
			}
		}
	} );

	return configData;
};

const fetchPageJson = ( topology, editorUrl ) => ( page ) => {
	return window
		.fetch( topology.replace( '{filename}', page.pageJsonFileName ), {
			referrer: editorUrl,
			mode: 'same-origin',
			headers: {
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Upgrade-Insecure-Requests': 1,
			},
		} )
		.then( ( result ) => result.json() )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} )
		.then( ( json ) => {
			page.postId = IdFactory.get( page.pageId );
			page.config = json;
			return page;
		} )
		.catch( () => {
			return {
				data: { document_data: {} },
				structure: { components: [] },
			};
		} );
};

module.exports = { extractConfigData, fetchPageJson };
