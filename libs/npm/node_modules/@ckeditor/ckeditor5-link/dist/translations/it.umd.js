/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'it' ]: { dictionary, getPluralForm } } = {"it":{"dictionary":{"Unlink":"Elimina collegamento","Link":"Collegamento","Link URL":"URL del collegamento","Link URL must not be empty.":"L'URL del link non può essere lasciato in bianco.","Link image":"Collega immagine","Edit link":"Modifica collegamento","Open link in new tab":"Apri collegamento in nuova scheda","This link has no URL":"Questo collegamento non ha un URL","Open in a new tab":"Apri in una nuova scheda","Downloadable":"Scaricabile","Create link":"Crea un link","Move out of a link":"Esce da un link"},getPluralForm(n){return n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'it' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'it' ].dictionary = Object.assign( e[ 'it' ].dictionary, dictionary );
e[ 'it' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
