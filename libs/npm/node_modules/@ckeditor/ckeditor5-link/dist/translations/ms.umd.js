/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ms' ]: { dictionary, getPluralForm } } = {"ms":{"dictionary":{"Unlink":"Buang pautan","Link":"Pautkan","Link URL":"Pautkan URL","Link URL must not be empty.":"URL pautan tidak boleh kosong.","Link image":"Pautkan imej","Edit link":"Sunting pautan","Open link in new tab":"Buka pautan dalam tab baru","This link has no URL":"Pautan ini tidak mempunyai URL","Open in a new tab":"Buka dalam tab baru","Downloadable":"Boleh dimuat turun","Create link":"Buat pautan","Move out of a link":"Alih keluar pautan"},getPluralForm(n){return 0;}}};
e[ 'ms' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ms' ].dictionary = Object.assign( e[ 'ms' ].dictionary, dictionary );
e[ 'ms' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
