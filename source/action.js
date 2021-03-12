const ReactDOM = require( 'react-dom' );
const { Component, createInterpolateElement } = require( '@wordpress/element' );
const { __, setLocaleData } = require( '@wordpress/i18n' );

const uiLanguage = browser.i18n.getUILanguage();
if ( i18n[ uiLanguage ] ) {
	setLocaleData( i18n[ uiLanguage ], 'default' );
}

class App extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			page: '',
		};
	}

	componentDidMount() {
		browser.tabs
			.query( { active: true, currentWindow: true } )
			.then( async ( tabs ) => {
				const currentTabUrl = tabs[ 0 ].url;

				if (
					currentTabUrl.startsWith(
						'https://manage.wix.com/dashboard/'
					)
				) {
					// Get the config that's stored in the background.js process.
					const config = await browser.runtime.sendMessage( {
						type: 'get_wix_config',
					} );

					if ( config ) {
						this.setState( { page: 'wix-site' } );
					} else {
						this.setState( { page: 'wix-site-no-config' } );
					}
				}
			} );
	}

	startWixExport() {
		browser.runtime.sendMessage( {
			type: 'start_wix_export',
		} );
	}

	render() {
		const { page } = this.state;

		switch ( page ) {
			case 'wix-site':
				return (
					<div id="wix-content">
						<p>{ __( 'You can export your site now!' ) }</p>
						<p>
							{ __(
								"If you're ready to export this site, click the export button."
							) }
						</p>
						<p>
							<button
								id="wix-export"
								onClick={ this.startWixExport }
							>
								{ __( 'Export' ) }
							</button>
						</p>
					</div>
				);
			case 'wix-site-no-config':
				return (
					<div id="wix-no-config">
						<p>
							{ __(
								'We were unable to retrieve Wix config data.'
							) }
						</p>

						<p>{ __( 'Please refresh the page to try again.' ) }</p>
					</div>
				);
			default:
				return (
					<div id="intro-content">
						<p>
							{ createInterpolateElement(
								__(
									"Welcome to WordPress' <em>Free (as in Speech)</em> extension!"
								),
								{ em: <em /> }
							) }
						</p>
						<p>
							{ __(
								'This extension helps you get control of your content back from services that otherwise prevent you from choosing to export the content that you own.'
							) }
						</p>
						<p>
							{ __(
								'Currently, <strong>Wix</strong> is supported.'
							) }
						</p>
						<p>
							{ __(
								'To get started, login to your account on Wix.com, then click this button again!'
							) }
						</p>
					</div>
				);
		}
	}
}

ReactDOM.render( <App />, document.getElementById( 'root' ) );
