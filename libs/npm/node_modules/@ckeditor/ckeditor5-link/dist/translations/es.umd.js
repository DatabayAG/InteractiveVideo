/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'es' ]: { dictionary, getPluralForm } } = {"es":{"dictionary":{"Unlink":"Quitar enlace","Link":"Enlace","Link URL":"URL del enlace","Link URL must not be empty.":"La URL del enlace no puede estar vacía.","Link image":"URL de la imagen","Edit link":"Editar enlace","Open link in new tab":"Abrir enlace en una pestaña nueva","This link has no URL":"Este enlace no tiene URL","Open in a new tab":"Abrir en una pestaña nueva ","Downloadable":"Descargable","Create link":"Crea un enlace","Move out of a link":"Sale de un enlace"},getPluralForm(n){return n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'es' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'es' ].dictionary = Object.assign( e[ 'es' ].dictionary, dictionary );
e[ 'es' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
