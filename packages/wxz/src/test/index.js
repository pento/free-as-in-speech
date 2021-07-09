/**
 * Internal dependencies
 */
const { getWXRDriver, SUPPORTED_VERSIONS } = require( '../index.js' );

describe( 'getWXRDriver', () => {
	test( 'function is defined', () => {
		expect( typeof getWXRDriver ).toBe( 'function' );
	} );

	test( 'SUPPORTED_VERSIONS is an array', () => {
		expect( Array.isArray( SUPPORTED_VERSIONS ) ).toBeTruthy();
	} );

	test( 'returns something for all SUPPORTED_VERSIONS', async () => {
		for ( const version of SUPPORTED_VERSIONS ) {
			const wxr = await getWXRDriver( version );
			expect( typeof wxr ).toBe( 'object' );
		}
	} );

	test( 'returns nothing for invalid version', async () => {
		const fakeVersion = '1.2.3.4';

		expect( SUPPORTED_VERSIONS ).not.toContain( fakeVersion );

		const wxr = await getWXRDriver( fakeVersion );

		expect( wxr ).toBeUndefined();
	} );
} );
