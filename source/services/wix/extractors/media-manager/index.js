export const settings = {
	/**
	 * The Wix application ID.
	 */
	appId: 'media-manager',

	/**
	 * This function will be called once the extraction process has started.
	 *
	 * @param {string} mediaToken The site media token.
	 */
	extract: async ( mediaToken ) => {
		const checkFolders = [ 'media-root' ];
		const knownFolders = [];

		const fileListPromises = [];

		while ( checkFolders.length > 0 ) {
			const currentFolder = checkFolders.pop();
			knownFolders.push( currentFolder );

			fileListPromises.push(
				window
					.fetch(
						`https://files.wix.com/go/site/media/files/list?site_token=${ mediaToken }&page_size=50&parent_folder_id=${ currentFolder }&media_type=picture,video,music,document,shape,site_icon,archive,swf`,
						{
							credentials: 'include',
						}
					)
					.then( ( result ) => result.json() )
					.then( ( fileData ) => fileData.files )
			);

			const folders = await window
				.fetch(
					`https://files.wix.com/go/site/media/folders/list?site_token=${ mediaToken }&page_size=50&parent_folder_id=${ currentFolder }`,
					{
						credentials: 'include',
					}
				)
				.then( ( result ) => result.json() );

			if ( Array.isArray( folders.folders ) ) {
				folders.folders.forEach( ( folder ) => {
					checkFolders.push( folder.folder_id );
				} );
			}
		}

		const fileList = await Promise.all( fileListPromises );

		return fileList.flat();
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} files The file list returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( files, wxr ) => {
		files.forEach( ( file ) => {
			wxr.addPost( {
				guid: `https://static.wixstatic.com/${ file.file_url }`,
				date: file.created_ts,
				title: file.original_file_name,
				type: 'attachment',
				attachment_url: `https://static.wixstatic.com/${ file.file_url }`,
			} );
		} );
	},
};
