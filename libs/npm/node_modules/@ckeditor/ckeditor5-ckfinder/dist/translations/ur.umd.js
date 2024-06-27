/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ur' ]: { dictionary, getPluralForm } } = {"ur":{"dictionary":{"Insert image or file":"عکس یا مسل نصب کریں","Could not obtain resized image URL.":"عکس کی پیمائش تبدیل کرنے کا ربط نہیں مل سکا۔","Selecting resized image failed":"پیمائش شدہ عکس چننے میں ناکامی ہوئی","Could not insert image at the current position.":"موجودہ مقام پہ عکس نصب نہیں ہو سکا۔","Inserting image failed":"عکس نصب نہیں ہو سکا۔"},getPluralForm(n){return (n != 1);}}};
e[ 'ur' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ur' ].dictionary = Object.assign( e[ 'ur' ].dictionary, dictionary );
e[ 'ur' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
