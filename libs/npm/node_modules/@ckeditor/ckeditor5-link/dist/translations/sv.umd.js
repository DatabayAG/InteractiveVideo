/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'sv' ]: { dictionary, getPluralForm } } = {"sv":{"dictionary":{"Unlink":"Ta bort länk","Link":"Länk","Link URL":"Länkens URL","Link URL must not be empty.":"Länkens URL får inte vara tom.","Link image":"Länka bild","Edit link":"Redigera länk","Open link in new tab":"Öppna länk i ny flik","This link has no URL":"Denna länk saknar URL","Open in a new tab":"Öppna i en ny flik","Downloadable":"Nedladdningsbar","Create link":"Skapa länk","Move out of a link":"Flytta bort från länken"},getPluralForm(n){return (n != 1);}}};
e[ 'sv' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'sv' ].dictionary = Object.assign( e[ 'sv' ].dictionary, dictionary );
e[ 'sv' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
