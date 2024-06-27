/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'uz' ]: { dictionary, getPluralForm } } = {"uz":{"dictionary":{"Insert HTML":"HTML kiritish","HTML snippet":"HTML snippet","Paste raw HTML here...":"HTML kodini shu yerga joylashtiring...","Edit source":"Kodni o'zgartirish","Save changes":"O'zgarishlarni saqlash","No preview available":"","Empty snippet content":""},getPluralForm(n){return 0;}}};
e[ 'uz' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'uz' ].dictionary = Object.assign( e[ 'uz' ].dictionary, dictionary );
e[ 'uz' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
