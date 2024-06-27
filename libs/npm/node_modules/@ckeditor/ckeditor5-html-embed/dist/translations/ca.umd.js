/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ca' ]: { dictionary, getPluralForm } } = {"ca":{"dictionary":{"Insert HTML":"Introduir HTML","HTML snippet":"Fragment de HTML","Paste raw HTML here...":"Enganxa HTML en brut aquí...","Edit source":"Editar la font","Save changes":"Desar els canvis","No preview available":"No hi ha cap vista prèvia disponible","Empty snippet content":"Contingut del fragment buit"},getPluralForm(n){return (n != 1);}}};
e[ 'ca' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ca' ].dictionary = Object.assign( e[ 'ca' ].dictionary, dictionary );
e[ 'ca' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
