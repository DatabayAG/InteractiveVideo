/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'uz' ]: { dictionary, getPluralForm } } = {"uz":{"dictionary":{"Font Size":"Shrift hajmi","Tiny":"Juda kichik","Small":"Kichik","Big":"Katta","Huge":"Juda katta","Font Family":"Shriftlar oilasi","Default":"Standart","Font Color":"Shrift rangi","Font Background Color":"Fon rangi","Document colors":"Sahifa rangi"},getPluralForm(n){return 0;}}};
e[ 'uz' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'uz' ].dictionary = Object.assign( e[ 'uz' ].dictionary, dictionary );
e[ 'uz' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
