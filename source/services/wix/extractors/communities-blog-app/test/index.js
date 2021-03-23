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
		tags: {
			tags: [],
			metaData: { total: 0 },
		},
		categories: [],
		extracted: {},
	},
];
data[ 0 ].extracted.posts = data[ 0 ].posts;
data[ 0 ].extracted.authors = data[ 0 ].authors;
data[ 0 ].extracted.categories = data[ 0 ].categories;
data[ 0 ].extracted.tags = data[ 0 ].tags.tags;

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
			response: JSON.stringify( testData.tags ),
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

describe( 'extract()', () => {
	beforeEach( () => fetchMock.reset() );

	test( 'pages through posts', async () => {
		const postPages = [
			[
				...Array( 500 )
					.fill( 0 )
					.map( ( value, id ) => ( { id } ) ),
			],
			[
				...Array( 100 )
					.fill( 0 )
					.map( ( value, id ) => ( { id: id + 500 } ) ),
			],
		];

		fetchMock
			.mock( {
				url:
					'begin:https://manage.wix.com/_api/communities-blog-node-api/_api/posts?offset=0',
				method: 'get',
				query: { status: 'published' },
				response: {
					body: JSON.stringify( postPages[ 0 ] ),
					headers: { 'wix-socialblog-totalresults': 600 },
				},
			} )
			.mock( {
				url:
					'begin:https://manage.wix.com/_api/communities-blog-node-api/_api/posts?offset=500',
				method: 'get',
				query: { status: 'published' },
				response: {
					body: JSON.stringify( postPages[ 1 ] ),
					headers: { 'wix-socialblog-totalresults': 600 },
				},
			} )
			.mock( {
				matcher:
					'https://manage.wix.com/_serverless/assignee-service/assignees',
				method: 'get',
				response: JSON.stringify( { assignees: [] } ),
			} )
			.mock( {
				matcher:
					'https://manage.wix.com/_api/communities-blog-node-api/v2/tags/query',
				method: 'post',
				response: JSON.stringify( {
					tags: [],
					metaData: { total: 0 },
				} ),
			} )
			.mock( '*', { body: '[]' } );

		const result = await index.extract( { instance: 'test' } );

		const expected = {
			posts: [ ...postPages[ 0 ], ...postPages[ 1 ] ],
			authors: [],
			categories: [],
			tags: [],
		};

		expect( result ).toEqual( expected );
	} );

	test( 'pages through categories', async () => {
		const categoryPages = [
			[
				...Array( 500 )
					.fill( 0 )
					.map( ( value, id ) => ( { id } ) ),
			],
			[
				...Array( 100 )
					.fill( 0 )
					.map( ( value, id ) => ( { id: id + 500 } ) ),
			],
		];

		fetchMock
			.mock( {
				url:
					'begin:https://manage.wix.com/_api/communities-blog-node-api/_api/categories?offset=0',
				method: 'get',
				response: {
					body: JSON.stringify( categoryPages[ 0 ] ),
					headers: { 'wix-socialblog-totalresults': 600 },
				},
			} )
			.mock( {
				url:
					'begin:https://manage.wix.com/_api/communities-blog-node-api/_api/categories?offset=500',
				method: 'get',
				response: {
					body: JSON.stringify( categoryPages[ 1 ] ),
					headers: { 'wix-socialblog-totalresults': 600 },
				},
			} )
			.mock( {
				matcher:
					'https://manage.wix.com/_serverless/assignee-service/assignees',
				method: 'get',
				response: JSON.stringify( { assignees: [] } ),
			} )
			.mock( {
				matcher:
					'https://manage.wix.com/_api/communities-blog-node-api/v2/tags/query',
				method: 'post',
				response: JSON.stringify( {
					tags: [],
					metaData: { total: 0 },
				} ),
			} )
			.mock( '*', { body: '[]' } );

		const result = await index.extract( { instance: 'test' } );

		const expected = {
			posts: [],
			authors: [],
			categories: [ ...categoryPages[ 0 ], ...categoryPages[ 1 ] ],
			tags: [],
		};

		expect( result ).toEqual( expected );
	} );

	test( 'pages through tags', async () => {
		const tagPages = [
			[
				...Array( 500 )
					.fill( 0 )
					.map( ( value, id ) => ( { id } ) ),
			],
			[
				...Array( 100 )
					.fill( 0 )
					.map( ( value, id ) => ( { id: id + 500 } ) ),
			],
		];

		fetchMock
			.mock( {
				matcher:
					'https://manage.wix.com/_serverless/assignee-service/assignees',
				method: 'get',
				response: JSON.stringify( { assignees: [] } ),
			} )
			.mock( {
				matcher:
					'https://manage.wix.com/_api/communities-blog-node-api/v2/tags/query',
				method: 'post',
				response: ( url, options ) => {
					let tags = [];
					const body = JSON.parse( options.body );

					if ( body.paging.offset === 0 ) {
						tags = tagPages[ 0 ];
					} else if ( body.paging.offset === 500 ) {
						tags = tagPages[ 1 ];
					}
					return JSON.stringify( {
						tags,
						metaData: { total: 600 },
					} );
				},
			} )
			.mock( '*', { body: '[]' } );

		const result = await index.extract( { instance: 'test' } );

		const expected = {
			posts: [],
			authors: [],
			categories: [],
			tags: [ ...tagPages[ 0 ], ...tagPages[ 1 ] ],
		};

		expect( result ).toEqual( expected );
	} );
} );
