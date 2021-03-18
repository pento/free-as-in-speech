const ReactDOM = require( 'react-dom' );
const { Component, createInterpolateElement } = require( '@wordpress/element' );
const { Spinner } = require( '@wordpress/components' );
const { __, setLocaleData } = require( '@wordpress/i18n' );

const uiLanguage = browser.i18n.getUILanguage();
if ( i18n[ uiLanguage ] ) {
	setLocaleData( i18n[ uiLanguage ], 'default' );
}

class App extends Component {
	constructor() {
		super( ...arguments );

		this.startWixExport = this.startWixExport.bind( this );

		this.state = {
			page: '',
			exportStatus: {},
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
					const apps = await browser.runtime.sendMessage( {
						type: 'get_wix_apps',
					} );

					if ( apps && apps.length > 0 ) {
						this.setState( {
							page: 'wix-site',
							apps,
							exportStatus: apps.reduce( ( status, app ) => {
								status[ app.id ] = 'not-started';
								return status;
							}, {} ),
						} );
					} else {
						this.setState( { page: 'wix-site-no-apps' } );
					}
				}
			} );

		browser.runtime.onMessage.addListener( ( message ) => {
			switch ( message.type ) {
				case 'export_progress_update':
					const newExportStatus = { ...this.state.exportStatus };
					newExportStatus[ message.data.id ] = message.data.state;
					this.setState( { exportStatus: newExportStatus } );
					break;
			}
		} );
	}

	startWixExport() {
		browser.runtime.sendMessage( {
			type: 'start_wix_export',
		} );
	}

	render() {
		const { page, exportStatus, apps } = this.state;

		const exportInProgress = Object.values( exportStatus ).includes(
			'in-progress'
		);

		const exportFinished = Object.values( exportStatus ).reduce(
			( finished, status ) => finished && status === 'done',
			true
		);

		switch ( page ) {
			case 'wix-site':
				return (
					<div id="wix-content">
						<p>
							{ __(
								'You can export your site now! The following Wix apps will be exported:'
							) }
						</p>
						<ul>
							{ apps.map( ( app ) => {
								return (
									<li key={ app.id }>
										{ app.name }{ ' ' }
										{ exportStatus[ app.id ] ===
										'in-progress' ? (
											<Spinner />
										) : (
											''
										) }
										{ exportStatus[ app.id ] === 'done'
											? '✅'
											: '' }
									</li>
								);
							} ) }
						</ul>
						<p>
							{ __(
								"If you're ready to export this site, click the export button."
							) }
						</p>
						<p>
							{ exportFinished ? (
								__( 'Export finished.' )
							) : (
								<button
									id="wix-export"
									onClick={ this.startWixExport }
									disabled={ exportInProgress }
								>
									{ __( 'Export' ) }
								</button>
							) }
						</p>
					</div>
				);

			case 'wix-site-no-apps':
				return (
					<div id="wix-no-apps">
						<p>
							{ __(
								'We were unable to retrieve a list of the installed Wix apps.'
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
							{ createInterpolateElement(
								__(
									'Currently, <strong>Wix</strong> is supported.'
								),
								{ strong: <strong /> }
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
