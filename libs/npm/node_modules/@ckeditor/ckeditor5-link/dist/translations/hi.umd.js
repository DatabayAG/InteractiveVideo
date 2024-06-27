/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'hi' ]: { dictionary, getPluralForm } } = {"hi":{"dictionary":{"Unlink":"Unlink","Link":"Link","Link URL":"Link URL","Link URL must not be empty.":"लिंक का URL रिक्त नहीं होना चाहिए.","Link image":"Link image","Edit link":"Edit link","Open link in new tab":"Open link in new tab","This link has no URL":"This link has no URL","Open in a new tab":"Open in a new tab","Downloadable":"Downloadable","Create link":"लिंक बनाएँ","Move out of a link":"लिंक के बाहर जाएँ"},getPluralForm(n){return (n != 1);}}};
e[ 'hi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'hi' ].dictionary = Object.assign( e[ 'hi' ].dictionary, dictionary );
e[ 'hi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
