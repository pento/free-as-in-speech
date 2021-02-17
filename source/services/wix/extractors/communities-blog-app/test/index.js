const fetchMock = require( 'fetch-mock-jest' );
const index = require( '../index' );

const data = [
	{
		posts: [
			{
				owner: 1,
			},
		],
		authors: [
			{
				siteMemberId: 1,
				name: 'bob',
			},
		],
		tags: [],
		categories: [],
		extracted: {},
	},
];
data[ 0 ].extracted.posts = data[ 0 ].posts;
data[ 0 ].extracted.authors = data[ 0 ].authors;
data[ 0 ].extracted.categories = data[ 0 ].categories;
data[ 0 ].extracted.tags = data[ 0 ].tags;

test.each( data )( 'extract posts', async ( testData ) => {
	fetchMock
		.mock( {
			matcher:
				'begin:https://manage.wix.com/_api/communities-blog-node-api/_api/posts',
			query: { status: 'published' },
			method: 'get',
			response: JSON.stringify( testData.posts ),
		} )
		.mock( {
			matcher:
				'https://manage.wix.com/_serverless/assignee-service/assignees',
			method: 'get',
			response: JSON.stringify( { assignees: testData.authors } ),
		} )
		.mock( {
			matcher:
				'https://manage.wix.com/_api/communities-blog-node-api/v2/tags/query',
			method: 'post',
			response: JSON.stringify( { tags: testData.tags } ),
		} )
		.mock( '*', { body: '[]' } );

	return index
		.extract( {
			instance: 'test',
		} )
		.then( ( result ) => {
			expect( result ).toEqual( testData.extracted );
		} );
} );
