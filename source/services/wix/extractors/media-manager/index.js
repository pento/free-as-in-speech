module.exports = {
	/**
	 * A name for the app, displayed to the user.
	 */
	appName: 'Media',

	/**
	 * The media manager doesn't have an app definition ID, we can use a fake one here.
	 */
	appDefinitionId: 'media-manager',

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
					.catch( () => {
						return { files: [] };
					} )
					.then( ( fileData ) => fileData.files )
			);

			const folders = await window
				.fetch(
					`https://files.wix.com/go/site/media/folders/list?site_token=${ mediaToken }&page_size=50&parent_folder_id=${ currentFolder }`,
					{
						credentials: 'include',
					}
				)
				.then( ( result ) => result.json() )
				.catch( () => {
					return { folders: [] };
				} );

			if ( Array.isArray( folders.folders ) ) {
				folders.folders.forEach( ( folder ) => {
					checkFolders.push( folder.folder_id );
				} );
			}
		}

		const fileList = await Promise.all( fileListPromises );

		// If a folder is empty, it will result in a 'null' file in the list. Remove them.
		return fileList.flat().filter( ( file ) => file !== null );
	},

	/**
	 * This function is called once we're ready to start generating the WXR file.
	 *
	 * @param {Object} files The file list returned by the extract() function.
	 * @param {Object} wxr The WXR encoder.
	 */
	save: async ( files, wxr ) => {
		files.forEach( ( file ) => {
			if ( file.media_type === 'video' ) {
				wxr.addPost( {
					guid: `https://video.wixstatic.com/${ file.file_output.video[ 0 ].url }`,
					date: file.created_ts * 1000,
					title: file.original_file_name,
					type: 'attachment',
					attachment_url: `https://video.wixstatic.com/${ file.file_output.video[ 0 ].url }`,
				} );
			} else {
				wxr.addPost( {
					guid: `https://static.wixstatic.com/${ file.file_url }`,
					date: file.created_ts * 1000,
					title: file.original_file_name,
					type: 'attachment',
					attachment_url: `https://static.wixstatic.com/${ file.file_url }`,
				} );
			}
		} );
	},
};
