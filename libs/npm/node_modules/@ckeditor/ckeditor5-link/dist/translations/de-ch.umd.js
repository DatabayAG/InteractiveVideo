/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'de-ch' ]: { dictionary, getPluralForm } } = {"de-ch":{"dictionary":{"Unlink":"Link entfernen","Link":"Link","Link URL":"Link Adresse","Link URL must not be empty.":"","Link image":"Bild verlinken","Edit link":"Link bearbeiten","Open link in new tab":"Link in neuem Tab öffnen","This link has no URL":"Dieser Link hat keine Adresse","Open in a new tab":"In neuem Tab öffnen","Downloadable":"Herunterladbar","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'de-ch' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'de-ch' ].dictionary = Object.assign( e[ 'de-ch' ].dictionary, dictionary );
e[ 'de-ch' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
