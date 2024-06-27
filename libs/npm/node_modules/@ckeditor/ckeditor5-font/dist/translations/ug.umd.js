/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ug' ]: { dictionary, getPluralForm } } = {"ug":{"dictionary":{"Font Size":"خەت چوڭلۇقى","Tiny":"ئەڭ كىچىك","Small":"كىچىك","Big":"چوڭ","Huge":"زور","Font Family":"خەت نۇسخىسى","Default":"سۈكۈتتىكى","Font Color":"خەت رەڭگى","Font Background Color":"خەت تەگلىك رەڭگى","Document colors":"پۈتۈك رەڭگى"},getPluralForm(n){return (n != 1);}}};
e[ 'ug' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ug' ].dictionary = Object.assign( e[ 'ug' ].dictionary, dictionary );
e[ 'ug' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
