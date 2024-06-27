/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'hr' ]: { dictionary, getPluralForm } } = {"hr":{"dictionary":{"Unlink":"Ukloni vezu","Link":"Veza","Link URL":"URL veze","Link URL must not be empty.":"","Link image":"URL slike","Edit link":"Uredi vezu","Open link in new tab":"Otvori vezu u novoj kartici","This link has no URL":"Ova veza nema URL","Open in a new tab":"Otvori u novoj kartici","Downloadable":"Moguće preuzeti","Create link":"","Move out of a link":""},getPluralForm(n){return n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;}}};
e[ 'hr' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'hr' ].dictionary = Object.assign( e[ 'hr' ].dictionary, dictionary );
e[ 'hr' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
