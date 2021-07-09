/**
 * Internal dependencies
 */
const { addHeaderPage, addFooterPage, parsePages } = require( './pages' );
const { convertMenu } = require( './menu' );
const { Logger } = require( '../../utils' );

const defaultConfig = {
	debug: true,
};

const setupLoggerInstance = ( debug ) => {
	Logger( 'wix', debug );
};

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
	config = Object.assign( defaultConfig, config );

	setupLoggerInstance( config.debug );

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
