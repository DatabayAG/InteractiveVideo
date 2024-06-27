/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'he' ]: { dictionary, getPluralForm } } = {"he":{"dictionary":{"Unlink":"ביטול קישור","Link":"קישור","Link URL":"קישור כתובת אתר","Link URL must not be empty.":"כתובת ה-URL של הקישור לא יכולה להיות ריקה.","Link image":"קישור תמונה","Edit link":"עריכת קישור","Open link in new tab":"פתח קישור בכרטיסייה חדשה","This link has no URL":"לקישור זה אין כתובת אתר","Open in a new tab":"פתח בכרטיסייה חדשה","Downloadable":"ניתן להורדה","Create link":"יצירת קישור","Move out of a link":"יציאה מקישור"},getPluralForm(n){return (n == 1 && n % 1 == 0) ? 0 : (n == 2 && n % 1 == 0) ? 1: 2;}}};
e[ 'he' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'he' ].dictionary = Object.assign( e[ 'he' ].dictionary, dictionary );
e[ 'he' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
