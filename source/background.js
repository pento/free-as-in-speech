browser.pageAction.onClicked.addListener( () => {
	void browser.tabs.create( {
		url: 'https://wordpress.org',
	} );
} );
