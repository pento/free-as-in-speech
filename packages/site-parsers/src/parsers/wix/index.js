/**
 * Internal dependencies
 */
const { addHeaderPage, addFooterPage, parsePages } = require( './pages' );
const { convertMenu } = require( './components/menu' );

const staticPagesParser = ( metaData, masterPage, pages = [] ) => {
	const data = {
		pages,
		menus: [],
		attachments: {},
		objects: [],
	};

	// ↓ methods mutate data object
	addHeaderPage( data, masterPage );
	addFooterPage( data, masterPage );
	parsePages( data, metaData, masterPage );
	convertMenu( data, masterPage );

	return data;
};

module.exports = {
	staticPagesParser,
};
