/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'fa' ]: { dictionary, getPluralForm } } = {"fa":{"dictionary":{"Unlink":"لغو پیوند","Link":"پیوند","Link URL":"نشانی اینترنتی پیوند","Link URL must not be empty.":"","Link image":"اتصال پیوند به تصویر","Edit link":"ویرایش پیوند","Open link in new tab":"باز کردن پیوند در برگه جدید","This link has no URL":"این پیوند نشانی اینترنتی ندارد","Open in a new tab":"بازکردن در برگه جدید","Downloadable":"قابل بارگیری","Create link":"","Move out of a link":""},getPluralForm(n){return (n > 1);}}};
e[ 'fa' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'fa' ].dictionary = Object.assign( e[ 'fa' ].dictionary, dictionary );
e[ 'fa' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
