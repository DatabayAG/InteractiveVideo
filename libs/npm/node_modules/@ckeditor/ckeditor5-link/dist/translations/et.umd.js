/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'et' ]: { dictionary, getPluralForm } } = {"et":{"dictionary":{"Unlink":"Eemalda link","Link":"Link","Link URL":"Lingi URL","Link URL must not be empty.":"Lingi URL peab olema sisestatud.","Link image":"Lingi pilt","Edit link":"Muuda linki","Open link in new tab":"Ava link uuel vahekaardil","This link has no URL":"Sellel lingil puudub URL","Open in a new tab":"Ava uuel kaardil","Downloadable":"Allalaaditav","Create link":"Loo link","Move out of a link":"Välju lingist"},getPluralForm(n){return (n != 1);}}};
e[ 'et' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'et' ].dictionary = Object.assign( e[ 'et' ].dictionary, dictionary );
e[ 'et' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
