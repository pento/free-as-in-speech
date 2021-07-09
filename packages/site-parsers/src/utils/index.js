const asyncForEach = async ( array, callback ) => {
	for ( let index = 0; index < array.length; index++ ) {
		await callback( array[ index ], index, array );
	}
};

module.exports = {
	asyncForEach,
	Logger: require( './logger' ),
	IdFactory: require( './idfactory' ),
	...require( './register-blocks' ),
};
