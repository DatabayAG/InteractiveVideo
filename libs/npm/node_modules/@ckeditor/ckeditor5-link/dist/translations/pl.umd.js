/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'pl' ]: { dictionary, getPluralForm } } = {"pl":{"dictionary":{"Unlink":"Usuń odnośnik","Link":"Wstaw odnośnik","Link URL":"Adres URL","Link URL must not be empty.":"Adres URL linku nie może być pusty","Link image":"Wstaw odnośnik do obrazka","Edit link":"Edytuj odnośnik","Open link in new tab":"Otwórz odnośnik w nowej zakładce","This link has no URL":"Nie podano adresu URL odnośnika","Open in a new tab":"Otwórz w nowej zakładce","Downloadable":"Do pobrania","Create link":"Tworzy link","Move out of a link":"Umożliwia wyjście z linku"},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}};
e[ 'pl' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'pl' ].dictionary = Object.assign( e[ 'pl' ].dictionary, dictionary );
e[ 'pl' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
