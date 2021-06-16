const { createBlock } = require( '@wordpress/blocks' );

module.exports = {
	type: 'GeoMap',
	parseComponent: ( component, { addObject } ) => {
		return createBlock( 'core-import/plugin-placeholder', {
			id: addObject( 'map', {
				height: component.layout.height, // int (px)
				width: component.layout.width, // int (px)

				zoom: component.propertyQuery.zoom, // int
				showZoom: component.propertyQuery.showZoom, // boolean
				showPosition: component.propertyQuery.showPosition, // boolean
				showStreetView: component.propertyQuery.showStreetView, // boolean
				showDirectionsLink: component.propertyQuery.showDirectionsLink, // boolean
				mapDragging: component.propertyQuery.mapDragging, // boolean
				mapType: component.propertyQuery.mapType, // enum: ROADMAP | SATELLITE | TERRAIN
				showMapType: component.propertyQuery.showMapType, // boolean

				locations: component.dataQuery.locations.map( ( item ) => ( {
					latitude: item.latitude,
					longitude: item.longitude,
					address: item.address,
				} ) ),

				pinColor:
					component.dataQuery.locations[ 0 ] &&
					component.dataQuery.locations[ 0 ].pinColor,
			} ),
		} );
	},
};
