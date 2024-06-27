/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ug' ]: { dictionary, getPluralForm } } = {"ug":{"dictionary":{"Unlink":"ئۇلانمىنى ئۈزۈش","Link":"ئۇلانما","Link URL":"ئۇلاش ئادىرسى","Link URL must not be empty.":"","Link image":"ئۇلانما سۈرەت","Edit link":"ئۇلانما تەھرىر","Open link in new tab":"ئۇلانمىنى يېڭى بەتكۈچتە ئاچ","This link has no URL":"بۇ ئۇلانمىنىڭ تور ئادرېسى يوق","Open in a new tab":"يېڭى بەتكۈچتە ئاچ","Downloadable":"چۈشۈرۈشچان","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'ug' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ug' ].dictionary = Object.assign( e[ 'ug' ].dictionary, dictionary );
e[ 'ug' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
