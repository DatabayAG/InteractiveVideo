/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ro' ]: { dictionary, getPluralForm } } = {"ro":{"dictionary":{"Insert image or file":"Inserează imagine sau fișier","Could not obtain resized image URL.":"Nu se poate obtine URL-ul imaginii redimensionate.","Selecting resized image failed":"Selecția imaginii redimensionate eșuată","Could not insert image at the current position.":"Nu se poate insera imaginea la poziția curentă.","Inserting image failed":"Inserție imagine eșuată"},getPluralForm(n){return (n==1?0:(((n%100>19)||((n%100==0)&&(n!=0)))?2:1));}}};
e[ 'ro' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ro' ].dictionary = Object.assign( e[ 'ro' ].dictionary, dictionary );
e[ 'ro' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
