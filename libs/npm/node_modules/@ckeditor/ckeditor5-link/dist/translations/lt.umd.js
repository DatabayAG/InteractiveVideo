/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'lt' ]: { dictionary, getPluralForm } } = {"lt":{"dictionary":{"Unlink":"Pašalinti nuorodą","Link":"Pridėti nuorodą","Link URL":"Nuorodos URL","Link URL must not be empty.":"Nuorodos URL negali būti tuščias.","Link image":"Susieti paveikslėlį","Edit link":"Keisti nuorodą","Open link in new tab":"Atidaryti nuorodą naujame skirtuke","This link has no URL":"Ši nuorda neturi URL","Open in a new tab":"Atverti naujoje kortelėje","Downloadable":"Parsisiunčiamas","Create link":"Sukurti nuorodą","Move out of a link":"Išeiti iš nuorodos"},getPluralForm(n){return (n % 10 == 1 && (n % 100 > 19 || n % 100 < 11) ? 0 : (n % 10 >= 2 && n % 10 <=9) && (n % 100 > 19 || n % 100 < 11) ? 1 : n % 1 != 0 ? 2: 3);}}};
e[ 'lt' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'lt' ].dictionary = Object.assign( e[ 'lt' ].dictionary, dictionary );
e[ 'lt' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
