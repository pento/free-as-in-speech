const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	componentType: 'wysiwyg.viewer.components.FormContainer',
	parseComponent: ( formComponent, recursiveComponentParser, resolver ) => {
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

		const form = formComponent.components
			.map( parseFormFields )
			.filter( Boolean );

		return createBlock( 'core-import/plugin-placeholder', {
			data: JSON.stringify( form ),
		} );
	},
};
