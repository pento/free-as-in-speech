import { startExport as startWixExport } from './wix';

export const startExport = ( service ) => {
	if ( service === 'wix' ) {
		startWixExport();
	}
};
