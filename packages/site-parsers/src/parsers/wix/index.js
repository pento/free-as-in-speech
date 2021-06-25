/**
 * Internal dependencies
 */
const { addHeaderPage, addFooterPage, parsePages } = require( './pages' );
const { convertMenu } = require( './menu' );

const staticPagesParser = async (
	metaData,
	masterPage,
	pages = [],
	config = {}
) => {
	const data = {
		pages,
		menus: [],
		attachments: {},
		objects: [],
	};

	// ↓ methods mutate data object
	addHeaderPage( data, masterPage );
	addFooterPage( data, masterPage );
	await parsePages( data, metaData, masterPage, config );
	convertMenu( data, masterPage );

	return data;
};

module.exports = {
	staticPagesParser,
};
