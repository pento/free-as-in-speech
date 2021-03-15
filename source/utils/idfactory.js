const ids = {};
let counter = 0;

module.exports = {
	get: ( idKey ) => {
		const key = String( idKey ).replace( /^#/, '' );
		if ( undefined === ids[ key ] ) {
			ids[ key ] = ++counter;
		}
console.log(key, ids[key]);
		return ids[ key ];
	},
};
