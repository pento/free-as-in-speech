const ids = {};
let counter = 0;

module.exports = {
	exists: ( idKey ) => {
		const key = String( idKey ).replace( /^#/, '' );
		if ( undefined === ids[ key ] ) {
			return false;
		}
		return ids[ key ];
	},
	get: ( idKey ) => {
		const key = String( idKey ).replace( /^#/, '' );
		if ( undefined === ids[ key ] ) {
			ids[ key ] = ++counter;
		}
		return ids[ key ];
	},
};
