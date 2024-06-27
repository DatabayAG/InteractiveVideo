/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'he' ]: { dictionary, getPluralForm } } = {"he":{"dictionary":{"media widget":"יישומון מדיה","Media URL":"כתובת URL של מדיה","Paste the media URL in the input.":"הדביקו את כתובת ה-URL של המדיה בקלט.","Tip: Paste the URL into the content to embed faster.":"טיפ: הדביקו את כתובת ה-URL לתוך התוכן כדי להטמיע מהר יותר.","The URL must not be empty.":"כתובת URL לא יכולה להיות ריקה.","This media URL is not supported.":"כתובת ה-URL של מדיה זו אינה נתמכת.","Insert media":"הכנס מדיה","Media":"מדיה","Media toolbar":"סרגל כלים של מדיה","Open media in new tab":"פתח מדיה בכרטיסיה חדשה"},getPluralForm(n){return (n == 1 && n % 1 == 0) ? 0 : (n == 2 && n % 1 == 0) ? 1: 2;}}};
e[ 'he' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'he' ].dictionary = Object.assign( e[ 'he' ].dictionary, dictionary );
e[ 'he' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
