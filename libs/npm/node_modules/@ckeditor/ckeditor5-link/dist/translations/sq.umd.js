/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'sq' ]: { dictionary, getPluralForm } } = {"sq":{"dictionary":{"Unlink":"Largo nyjën","Link":"Shto nyjën","Link URL":"Nyja e URL-së","Link URL must not be empty.":"","Link image":"Foto e nyjes","Edit link":"Redakto nyjën","Open link in new tab":"Hap nyjën në faqe të re","This link has no URL":"Kjo nyje nuk ka URL","Open in a new tab":"Hape në një fletë të re","Downloadable":"E shkarkueshme","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'sq' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'sq' ].dictionary = Object.assign( e[ 'sq' ].dictionary, dictionary );
e[ 'sq' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
