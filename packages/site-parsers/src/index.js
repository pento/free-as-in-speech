const utils = require( './utils' );
const { staticPagesParser } = require( './parsers/wix' );

module.exports = {
	utils,
	staticPagesParserWix: staticPagesParser,
};
