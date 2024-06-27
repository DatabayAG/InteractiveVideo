/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'id' ]: { dictionary, getPluralForm } } = {"id":{"dictionary":{"media widget":"widget media","Media URL":"URL Media","Paste the media URL in the input.":"Tempelkan URL ke dalam bidang masukan.","Tip: Paste the URL into the content to embed faster.":"Tip: Tempelkan URL ke bagian konten untuk sisip cepat.","The URL must not be empty.":"URL tidak boleh kosong.","This media URL is not supported.":"URL media ini tidak didukung.","Insert media":"Sisipkan media","Media":"Media","Media toolbar":"Alat media","Open media in new tab":"Buka media di tab baru"},getPluralForm(n){return 0;}}};
e[ 'id' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'id' ].dictionary = Object.assign( e[ 'id' ].dictionary, dictionary );
e[ 'id' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
