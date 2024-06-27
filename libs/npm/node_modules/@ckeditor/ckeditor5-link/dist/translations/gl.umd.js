/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'gl' ]: { dictionary, getPluralForm } } = {"gl":{"dictionary":{"Unlink":"Desligar","Link":"Ligar","Link URL":"URL de ligazón","Link URL must not be empty.":"","Link image":"Ligazón da imaxe","Edit link":"Editar a ligazón","Open link in new tab":"Abrir a ligazón nunha nova lapela","This link has no URL":"Esta ligazón non ten URL","Open in a new tab":"Abrir nunha nova lapela","Downloadable":"Descargábel","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'gl' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'gl' ].dictionary = Object.assign( e[ 'gl' ].dictionary, dictionary );
e[ 'gl' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
