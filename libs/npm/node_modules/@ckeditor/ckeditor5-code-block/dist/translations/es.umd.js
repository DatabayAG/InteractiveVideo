/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'es' ]: { dictionary, getPluralForm } } = {"es":{"dictionary":{"Insert code block":"Insertar bloque de código","Plain text":"Texto plano","Leaving %0 code snippet":"Abandonando fragmento de código %0","Entering %0 code snippet":"Ingresando fragmento de código %0","Entering code snippet":"Ingresando fragmento de código","Leaving code snippet":"Abandonando fragmento de código","Code block":"Bloque de código"},getPluralForm(n){return n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'es' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'es' ].dictionary = Object.assign( e[ 'es' ].dictionary, dictionary );
e[ 'es' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
