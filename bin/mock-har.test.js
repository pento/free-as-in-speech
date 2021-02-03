const fetchMock = require( 'fetch-mock-jest' );
const index = require( '../source/services/wix/extractors/communities-blog-app/index' );
import { loadHar } from './mock-har';

test( 'extract posts', async () => {
	loadHar(
		'distribution/6eab6905-bad4-af4d-a26f-f65a9471b44c_Archive [21-02-03 12-17-59].har',
		fetchMock
	);

	return index.settings
		.extract( {
			instance: 'test',
		} )
		.then( ( result ) => {
			expect( result.authors[ 0 ].userId ).toEqual(
				'6845480d-cf07-4eba-8b77-395b77492f0d'
			);
		} );
} );
