const IdFactory = require( '../../../../utils/idfactory.js' );

const parseWixLink = ( link, metaData ) => {
	if ( ! link ) {
		return { url: '' };
	}

	switch ( link.type ) {
		case 'DocumentLink':
			const prefix = metaData.serviceTopology.staticDocsUrl;
			const filename = ( link.docId || '' ).replace( /^ugd\//g, '' );
			const url = prefix + '/' + filename;
			return {
				url,
				attachment: {
					src: url,
					alt: link.name || filename,
				},
			};
		case 'EmailLink':
			return {
				url:
					`mailto:${ link.recipient }` +
					( link.subject ? `?subject=${ link.subject }` : '' ),
			};
		case 'PhoneLink':
			return { url: 'tel:' + link.phoneNumber };
		case 'ExternalLink':
			return {
				url: link.url || '#',
				target: link.target || null,
			};
		case 'AnchorLink':
		case 'PageLink':
			const page = link.pageId;
			if ( ! page || page.skipExport ) {
				return { url: '' };
			}
			return {
				type: 'post_type',
				object: 'page',
				objectId: IdFactory.get( page.id ),
				originalId: page.id,
				anchor:
					( link.anchorDataId && link.anchorDataId.compId ) || null,
				url: '/' + page.pageUriSEO,
				title: link.anchorName || null,
				target: link.target || null,
			};
	}
	return { url: '' };
};

const getUrlForLink = ( link, currentPage = null ) => {
	if ( link.type === 'post_type' ) {
		const hash = link.anchor ? `#${ link.anchor }` : '';
		if ( currentPage === link.originalId ) {
			// linking to anchor on the same page
			return hash;
		}
		if ( link.url ) {
			return link.url + hash;
		}
		// full link
		return `?p=${ link.objectId }` + hash;
	}
	return link.url;
};

const getHtmlLinkAttributes = ( link, currentPage = null ) => ( {
	href: getUrlForLink( link, currentPage ),
	target: ! link.target || link.target === '_self' ? null : link.target,
	rel: ! link.target || link.target === '_self' ? null : 'noopener',
	title: link.title,
} );

module.exports = { parseWixLink, getUrlForLink, getHtmlLinkAttributes };
