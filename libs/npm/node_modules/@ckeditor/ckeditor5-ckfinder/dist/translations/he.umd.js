/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'he' ]: { dictionary, getPluralForm } } = {"he":{"dictionary":{"Insert image or file":"הוסף תמונה או קובץ","Could not obtain resized image URL.":"לא ניתן להשיג תמונה מוקטנת","Selecting resized image failed":"בחירת תמונה מוקטנת נכשלה","Could not insert image at the current position.":"לא ניתן להוסיף תמונה במיקום הנוכחי","Inserting image failed":"הוספת תמונה נכשלה"},getPluralForm(n){return (n == 1 && n % 1 == 0) ? 0 : (n == 2 && n % 1 == 0) ? 1: 2;}}};
e[ 'he' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'he' ].dictionary = Object.assign( e[ 'he' ].dictionary, dictionary );
e[ 'he' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
