/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ne' ]: { dictionary, getPluralForm } } = {"ne":{"dictionary":{"Unlink":"अनलिङ्क गर्नुहोस्","Link":"लिङ्क","Link URL":"लिङ्क यूआरएल","Link URL must not be empty.":"","Link image":"","Edit link":"लिङ्क सम्पादन गर्नुहोस्","Open link in new tab":"नयाँ ट्याबमा लिङ्क खोल्नुहोस्","This link has no URL":"यो लिङ्कसँग यूआरएल छैन","Open in a new tab":"नयाँ ट्याबमा खोल्न","Downloadable":"डाउनलोड योग्य","Create link":"","Move out of a link":""},getPluralForm(n){return (n != 1);}}};
e[ 'ne' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ne' ].dictionary = Object.assign( e[ 'ne' ].dictionary, dictionary );
e[ 'ne' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
