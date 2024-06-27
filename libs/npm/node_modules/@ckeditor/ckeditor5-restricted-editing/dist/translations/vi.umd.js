/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'vi' ]: { dictionary, getPluralForm } } = {"vi":{"dictionary":{"Disable editing":"Tắt tính năng chỉnh sửa","Enable editing":"Bật tính năng chỉnh sửa","Previous editable region":"Vùng có thể chỉnh sửa trước đó","Next editable region":"Vùng có thể chỉnh sửa tiếp theo","Navigate editable regions":"Di chuyển giữa các vùng có thể chỉnh sửa"},getPluralForm(n){return 0;}}};
e[ 'vi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'vi' ].dictionary = Object.assign( e[ 'vi' ].dictionary, dictionary );
e[ 'vi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
