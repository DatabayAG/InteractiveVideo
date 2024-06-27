/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'fi' ]: { dictionary, getPluralForm } } = {"fi":{"dictionary":{"Unlink":"Poista linkki","Link":"Linkki","Link URL":"Linkin osoite","Link URL must not be empty.":"Linkin URL ei voi olla tyhjä.","Link image":"Linkkikuva","Edit link":"Muokkaa linkkiä","Open link in new tab":"Avaa linkki uudessa välilehdessä","This link has no URL":"Linkillä ei ole URL-osoitetta","Open in a new tab":"Avaa uudelle välilehdelle","Downloadable":"Ladattava","Create link":"Luo linkki","Move out of a link":"Siirrä linkin ulkopuolelle"},getPluralForm(n){return (n != 1);}}};
e[ 'fi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'fi' ].dictionary = Object.assign( e[ 'fi' ].dictionary, dictionary );
e[ 'fi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
