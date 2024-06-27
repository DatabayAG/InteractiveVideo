/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'tr' ]: { dictionary, getPluralForm } } = {"tr":{"dictionary":{"Unlink":"Bağlantıyı kaldır","Link":"Bağlantı","Link URL":"Bağlantı Adresi","Link URL must not be empty.":"Bağlantı URL'si boş olmamalıdır.","Link image":"Resim bağlantısı","Edit link":"Bağlantıyı değiştir","Open link in new tab":"Yeni sekmede aç","This link has no URL":"Bağlantı adresi yok","Open in a new tab":"Yeni sekmede aç","Downloadable":"İndirilebilir","Create link":"Bağlantı oluştur","Move out of a link":"Bir bağlantıdan çık"},getPluralForm(n){return (n > 1);}}};
e[ 'tr' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'tr' ].dictionary = Object.assign( e[ 'tr' ].dictionary, dictionary );
e[ 'tr' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
