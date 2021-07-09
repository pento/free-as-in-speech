const debugLog = require( 'debug' );

function Logger( provider ) {
	const path = `siteParser:${ provider }:apps:staticPages`;

	return {
		log( component ) {
			debugLog( `${ path }:${ component }` )(
				arguments[ 1 ] ? arguments[ 1 ] : '',
				arguments[ 2 ] ? arguments[ 2 ] : '',
				arguments[ 3 ] ? arguments[ 3 ] : ''
			);
		},
	};
}

// Logger singleton per provider
module.exports = ( () => {
	const instance = {};

	return ( provider ) => {
		if ( ! instance[ provider ] ) {
			instance[ provider ] = Logger( provider );
		}
		return instance[ provider ];
	};
} )();
