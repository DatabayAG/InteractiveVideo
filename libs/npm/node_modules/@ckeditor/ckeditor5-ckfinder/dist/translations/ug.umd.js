/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ug' ]: { dictionary, getPluralForm } } = {"ug":{"dictionary":{"Insert image or file":"رەسىم ياكى ھۆججەت قىستۇر","Could not obtain resized image URL.":"چوڭلۇقى تەڭشەلگەن سۈرەتنىڭ تور ئادرېسىغا ئېرىشەلمىدى","Selecting resized image failed":"چوڭلۇقى تەڭشەلگن سۈرەتنى تاللىيالمىدى","Could not insert image at the current position.":"نۆۋەتتە ئورۇنغا سۈرەتنى قىستۇرالمايدۇ.","Inserting image failed":"سۈرەت قىستۇرالمىدى"},getPluralForm(n){return (n != 1);}}};
e[ 'ug' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ug' ].dictionary = Object.assign( e[ 'ug' ].dictionary, dictionary );
e[ 'ug' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
