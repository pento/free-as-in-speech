const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.FormContainer',
	parseComponent: (
		formComponent,
		_recursiveComponentParser,
		resolver,
		{ addObject }
	) => {
		const parseFormFields = ( component ) => {
			component = resolver( component );

			if ( component.components ) {
				return component.components
					.map( parseFormFields )
					.filter( Boolean );
			}

			switch ( component.dataQuery.type ) {
				case 'DatePicker':
					return {
						type: 'date',
						label: component.dataQuery.label,
						placeholder: component.dataQuery.placeholder,
						required: !! component.propertyQuery.required,
						dateFormat: component.propertyQuery.dateFormat,
						disabledDates: component.dataQuery.disabledDates,
						disabledDaysOfWeek:
							component.dataQuery.disabledDaysOfWeek,
						allowPastDates: component.dataQuery.allowPastDates,
						allowFutureDates: component.dataQuery.allowFutureDates,
					};
				case 'TextAreaInput':
					return {
						type: 'textarea',
						label: component.dataQuery.label,
						placeholder: component.dataQuery.placeholder,
						required: !! component.propertyQuery.required,
					};
				case 'TextInput':
					return {
						type: 'text',
						label: component.dataQuery.label,
						placeholder: component.dataQuery.placeholder,
						required: !! component.propertyQuery.required,
					};
				case 'SelectableList':
					return {
						type: 'select',
						label: component.dataQuery.label,
						options: component.dataQuery.options.map(
							( option ) => {
								return {
									text: option.text,
									value: option.value,
									description: option.description,
								};
							}
						),
						required: !! component.propertyQuery.required,
					};
				case 'LinkableButton':
					return {
						type:
							component.dataQuery.link &&
							component.dataQuery.link.type ===
								'FormSubmitButtonLink'
								? 'submit'
								: 'button',
						label: component.dataQuery.label,
					};
			}
		};

		const fields = formComponent.components
			.map( parseFormFields )
			.filter( Boolean );

		const email = formComponent.connectionQuery.items
			.map( ( item ) => {
				if ( 'ConnectionItem' !== item.type ) return false;
				if ( ! item.config ) return false;
				if ( ! item.isPrimary ) return false;
				const config = JSON.parse( item.config );
				if ( ! config.email ) return false;
				return config.email;
			} )
			.filter( Boolean )[ 0 ];

		const form = {
			fields,
		};

		if ( email ) {
			form.email = email;
		}

		return createBlock( 'core-import/plugin-placeholder', {
			id: addObject( 'contact-form', form ),
		} );
	},
};
