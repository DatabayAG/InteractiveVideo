/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ja' ]: { dictionary, getPluralForm } } = {"ja":{"dictionary":{"Unlink":"リンク解除","Link":"リンク","Link URL":"リンクURL","Link URL must not be empty.":"リンクURLは空白にできません。","Link image":"リンク画像","Edit link":"リンクを編集","Open link in new tab":"新しいタブでリンクを開く","This link has no URL":"リンクにURLが設定されていません","Open in a new tab":"新しいタブで開く","Downloadable":"ダウンロード可能","Create link":"リンクを作成する","Move out of a link":"リンクの外に移動する"},getPluralForm(n){return 0;}}};
e[ 'ja' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ja' ].dictionary = Object.assign( e[ 'ja' ].dictionary, dictionary );
e[ 'ja' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
