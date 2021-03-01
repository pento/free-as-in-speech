const cheerio = require( 'cheerio' );
const dayjs = require( 'dayjs' );
var utc = require('dayjs/plugin/utc')
const { pasteHandler, serialize } = require( '@wordpress/blocks' );

dayjs.extend( utc );

const parseDateString = ( str ) => {
	const lowerCaseStr = str.toLowerCase().trim();

	const today = dayjs.utc().startOf( 'day' );

	switch ( lowerCaseStr ) {
		case 'today':
			return today.format();
		case 'yesterday':
			return today.subtract( 1, 'day' ).format();
	}

	const parsedRelativeDate = lowerCaseStr.match( /^last ([a-z]+)$/ );
	if ( parsedRelativeDate ) {
		const thisDay = today.day();
		const parsedDay = dayjs.en.weekdays.findIndex( weekday => weekday.toLowerCase() === parsedRelativeDate[ 1 ] );
		const isLastWeek = parsedDay >= thisDay;
		return today.day( parsedDay - ( isLastWeek ? 7 : 0 ) ).format();
	}

	const parsedProperDate = dayjs.utc( lowerCaseStr + ' UTC' );
	if ( parsedProperDate.isValid() ) {
		return parsedProperDate.format();
	}

	return 0;
};

module.exports = {
	/**
	 * The Wix application definition ID.
	 */
	appDefinitionId: '13d7e48f-0739-6252-8018-457a75beae4b',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {Object} config The app-specific config extracted from the Wix page.
	 */
	extract: async ( config ) => {
		const url = new URL(
			'https://easy-blog-production.myeasyappsserver.com/'
		);
		url.searchParams.set( 'instance', config.instance );
		// We are here switching to a premium theme that supports tags.
		url.searchParams.set( 'theme', 'Photogram' );
		return await window
			.fetch( url )
			.then( ( result ) => result.text() )
			.then( ( html ) => {
				const $ = cheerio.load( html );
				return $( '.blog-post' )
					.map( ( i, post ) => {
						const $post = $( post );
						return {
							title:
								$post.find( '.post-title' ).text().trim() || '',
							content:
								$post.find( '.post-text' ).html().trim() || '',
							images:
								$post
									.find( '.post-photo' )
									.map( ( index, el ) =>
										$( el ).attr( 'src' )
									)
									.get() || [],
							video:
								$post
									.find( 'iframe.embed-responsive-item' )
									.attr( 'src' ) || null,
							tags: $post
								.find( '.tags .tag' )
								.map( ( index, el ) =>
									$( el ).text().trim().replace( /^\#/, '' )
								)
								.get(),
							date: parseDateString(
								$post
									.find( '.post-meta li:first-child' )
									.text()
									.trim()
							),
						};
					} )
					.get();
			} );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} data The data blob returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( data, wxr ) => {
		data.forEach( ( post ) => {
			const postTags = post.tags.map( ( postTag ) => ( {
				type: 'tag',
				slug: postTag,
				name: postTag,
			} ) );

			wxr.addPost( {
				date: post.date,
				title: post.title,
				content: pasteHandler( { HTML: post.content, mode: 'BLOCKS' } )
					.filter( ( blockContent ) => blockContent !== false )
					.map( ( wpBlock ) => serialize( wpBlock ) )
					.join( '\n\n' ),
				status: 'publish',
				sticky: 0,
				type: 'post',
				comment_status: 'closed',
				terms: [ ...postTags ],
			} );
		} );
	},
};
