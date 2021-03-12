const { parseFileSync } = require( 'po2json' );
const glob = require( 'glob' );
const { writeFileSync } = require( 'fs' );

const languageFiles = glob.sync( 'languages/*.po' );

let languagePackData = 'const i18n = {};\n';

languageFiles.forEach( ( file ) => {
	const languageJson = parseFileSync( file, { format: 'jed1.x' } );

	languagePackData += `i18n.${
		languageJson.locale_data.messages[ '' ].lang
	} = ${ JSON.stringify( languageJson.locale_data.messages ) };\n`;
} );

writeFileSync( 'distribution/build/language-pack.js', languagePackData );
