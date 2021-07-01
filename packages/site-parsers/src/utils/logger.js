function Logger( provider, debug ) {
	const path = `siteParser:${ provider }:apps:staticPages`;

	return {
		log( component ) {
			if ( ! debug ) return;

			// eslint-disable-next-line no-console
			console.log(
				`${ path }:${ provider }:${ component }`,
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

	return ( provider, debug ) => {
		if ( ! instance[ provider ] ) {
			instance[ provider ] = Logger( provider, debug );
		}
		return instance[ provider ];
	};
} )();
