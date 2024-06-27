/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'it' ]: { dictionary, getPluralForm } } = {"it":{"dictionary":{"Insert image or file":"Inserisci immagine o file","Could not obtain resized image URL.":"Non è stato possibile ottenere l'URL dell'immagine ridimensionata.","Selecting resized image failed":"La selezione dell'immagine ridimensionata è fallita","Could not insert image at the current position.":"Non è stato possibile inserire l'immagine nella posizione corrente.","Inserting image failed":"L'inserimento dell'immagine è fallito"},getPluralForm(n){return n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'it' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'it' ].dictionary = Object.assign( e[ 'it' ].dictionary, dictionary );
e[ 'it' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
