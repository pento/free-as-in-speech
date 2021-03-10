const ReactDOM = require( 'react-dom' );
const { Component } = require( '@wordpress/element' );
const { html } = require( 'htm/react' );

class App extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			page: '',
		};
	}
	componentDidMount() {
		console.log( 'lol' );
		browser.tabs
			.query( { active: true, currentWindow: true } )
			.then( async ( tabs ) => {
				const currentTabUrl = tabs[ 0 ].url;
				console.log( tabs );

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

	render( props, state ) {
		console.log( { props, state } );
		let page = '';
		if ( state && state.page ) {
			page = state.page;
		}
		switch ( page ) {
			case 'wix-site':
				return html`<div id="wix-content">
					<p>You can export your site now!</p>
					<p>
						If you're ready to export this site, click the export
						button.
					</p>
					<p>
						<button
							id="wix-export"
							onClick={ this.startWixExport }
						>
							Export
						</button>
					</p>
				</div>`;
			case 'wix-site-no-config':
				return html`<div id="wix-no-config">
					<p>We were unable to retrieve Wix config data.</p>

					<p>Please refresh the page to try again.</p>
				</div>`;
			default:
				return html`<div id="intro-content">
					<p>
						Welcome to WordPress'
						<em>Free (as in Speech)</em> extension!
					</p>
					<p>
						This extension helps you get control of your content
						back from services that otherwise prevent you from
						choosing to export the content that you own.
					</p>
					<p>Currently, <strong>Wix</strong> is supported.</p>
					<p>
						To get started, login to your account on Wix.com, then
						click this button again!
					</p>
				</div>`;
		}
	}
}

ReactDOM.render( html`<${ App } />`, document.getElementById( 'root' ) );
