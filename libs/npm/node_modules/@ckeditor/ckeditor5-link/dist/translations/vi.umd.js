/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'vi' ]: { dictionary, getPluralForm } } = {"vi":{"dictionary":{"Unlink":"Bỏ liên kết","Link":"Chèn liên kết","Link URL":"Đường dẫn liên kết","Link URL must not be empty.":"Không được để trống URL đường liên kết.","Link image":"Liên kết của ảnh","Edit link":"Sửa liên kết","Open link in new tab":"Mở liên kết","This link has no URL":"Liên kết không có đường dẫn","Open in a new tab":"Mở trên tab mới","Downloadable":"Có thể tải về","Create link":"Tạo liên kết","Move out of a link":"Di chuyển ra khỏi một liên kết"},getPluralForm(n){return 0;}}};
e[ 'vi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'vi' ].dictionary = Object.assign( e[ 'vi' ].dictionary, dictionary );
e[ 'vi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
