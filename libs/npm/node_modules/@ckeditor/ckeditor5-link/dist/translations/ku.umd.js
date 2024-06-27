/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ku' ]: { dictionary, getPluralForm } } = {"ku":{"dictionary":{"Unlink":"لابردنی بەستەر","Link":"بەستەر","Link URL":"ناونیشانی بەستەر","Link URL must not be empty.":"","Link image":"","Edit link":"دەستکاری بەستەر","Open link in new tab":"کردنەوەی بەستەرەکە لە پەڕەیەکی نوێ","This link has no URL":"ئەم بەستەرە ناونیشانی نیە","Open in a new tab":"کردنەوەی لە پەنجەرەیەکی نوێ","Downloadable":"Downloadable","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'ku' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ku' ].dictionary = Object.assign( e[ 'ku' ].dictionary, dictionary );
e[ 'ku' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
