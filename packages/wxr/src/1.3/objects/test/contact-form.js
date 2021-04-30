/**
 * External dependencies
 */
const FDBFactory = require( 'fake-indexeddb/lib/FDBFactory' );

/**
 * Internal dependencies
 */
const { WXRDriver } = require( '../../index.js' );

describe( 'Contact Form Object', () => {
	beforeEach( () => {
		window.indexedDB = new FDBFactory();
	} );

	test( 'All fields are written as expected', async () => {
		const wxr = new WXRDriver();
		await wxr.connect();

		wxr.addObject( 'contact-form', {
			email: 'gary@pento.net',
			fields: [
				{
					type: 'text',
					label: 'Name',
					required: true,
				},
				{
					type: 'text',
					label: 'Email',
					format: 'email',
					required: true,
				},
				{
					type: 'text',
					label: 'Phone',
					format: 'phone-number',
				},
				{
					type: 'text',
					label: 'Date',
					format: 'date',
					dateFormat: 'MM/DD/YYYY',
					required: true,
				},
				{
					type: 'select',
					label: 'Time',
					options: [
						{ text: '11:30 AM', value: '11:30 AM' },
						{ text: '12:00 PM', value: '12:00 PM' },
						{ text: '12:30 PM', value: '12:30 PM' },
						{ text: '1:00 PM', value: '1:00 PM' },
						{ text: '1:30 PM', value: '1:30 PM' },
						{ text: '2:00 PM', value: '2:00 PM' },
						{ text: '7:00 PM', value: '7:00 PM' },
						{ text: '7:30 PM', value: '7:30 PM' },
						{ text: '8:00 PM', value: '8:00 PM' },
						{ text: '8:30 PM', value: '8:30 PM' },
						{ text: '9:00 PM', value: '9:00 PM' },
						{ text: '9:30 PM', value: '9:30 PM' },
					],
					required: true,
				},
				{
					type: 'textarea',
					label: 'Special Request',
					placeholder: '',
				},
				{ type: 'submit', label: 'Submit' },
			],
		} );

		const xml = await wxr.export();

		expect( xml ).toMatchSnapshot();
	} );
} );
