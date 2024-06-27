/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'th' ]: { dictionary, getPluralForm } } = {"th":{"dictionary":{"Disable editing":"ปิดใช้งานการแก้ไข","Enable editing":"เปิดใช้งานการแก้ไข","Previous editable region":"พื้นที่ซึ่งสามารถแก้ไขได้ก่อนหน้านี้","Next editable region":"พื้นที่ซึ่งสามารถแก้ไขได้ถัดไป","Navigate editable regions":"นำทางไปยังพื้นที่ซึ่งสามารถแก้ไขได้"},getPluralForm(n){return 0;}}};
e[ 'th' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'th' ].dictionary = Object.assign( e[ 'th' ].dictionary, dictionary );
e[ 'th' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
