/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ja' ]: { dictionary, getPluralForm } } = {"ja":{"dictionary":{"Yellow marker":"黄色のマーカー","Green marker":"緑のマーカー","Pink marker":"ピンクのマーカー","Blue marker":"青のマーカー","Red pen":"赤のマーカー","Green pen":"緑のペン","Remove highlight":"ハイライトの削除","Highlight":"ハイライト","Text highlight toolbar":"テキストのハイライト"},getPluralForm(n){return 0;}}};
e[ 'ja' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ja' ].dictionary = Object.assign( e[ 'ja' ].dictionary, dictionary );
e[ 'ja' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
