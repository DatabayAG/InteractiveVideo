/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'hu' ]: { dictionary, getPluralForm } } = {"hu":{"dictionary":{"Unlink":"Link eltávolítása","Link":"Link","Link URL":"URL link","Link URL must not be empty.":"A link URL-címe nem lehet üres.","Link image":"Hivatkozás","Edit link":"Link szerkesztése","Open link in new tab":"Link megnyitása új ablakban","This link has no URL":"A link nem tartalmaz URL-t","Open in a new tab":"Megnyitás új lapon","Downloadable":"Letölthető","Create link":"Link létrehozása","Move out of a link":"Kilépés egy linkből"},getPluralForm(n){return (n != 1);}}};
e[ 'hu' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'hu' ].dictionary = Object.assign( e[ 'hu' ].dictionary, dictionary );
e[ 'hu' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
