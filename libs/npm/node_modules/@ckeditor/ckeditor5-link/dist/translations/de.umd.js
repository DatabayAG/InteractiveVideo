/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'de' ]: { dictionary, getPluralForm } } = {"de":{"dictionary":{"Unlink":"Link entfernen","Link":"Link","Link URL":"Linkadresse","Link URL must not be empty.":"Die Link-URL darf nicht leer sein.","Link image":"Bild verlinken","Edit link":"Link bearbeiten","Open link in new tab":"Link im neuen Tab öffnen","This link has no URL":"Dieser Link hat keine Adresse","Open in a new tab":"In neuem Tab öffnen","Downloadable":"Herunterladbar","Create link":"Link erstellen","Move out of a link":"Linkauswahl aufheben"},getPluralForm(n){return (n != 1);}}};
e[ 'de' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'de' ].dictionary = Object.assign( e[ 'de' ].dictionary, dictionary );
e[ 'de' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
