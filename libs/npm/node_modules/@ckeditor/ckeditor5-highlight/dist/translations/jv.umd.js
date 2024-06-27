/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'jv' ]: { dictionary, getPluralForm } } = {"jv":{"dictionary":{"Yellow marker":"Panandha jene","Green marker":"Panandha ijem","Pink marker":"Penandha abrit jambon","Blue marker":"Penandha biru","Red pen":"Penandha abrit","Green pen":"Pen ijem","Remove highlight":"Busek sorot","Highlight":"Sorot","Text highlight toolbar":""},getPluralForm(n){return 0;}}};
e[ 'jv' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'jv' ].dictionary = Object.assign( e[ 'jv' ].dictionary, dictionary );
e[ 'jv' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
