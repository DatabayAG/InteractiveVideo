/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ro' ]: { dictionary, getPluralForm } } = {"ro":{"dictionary":{"media widget":"widget media","Media URL":"Media URL","Paste the media URL in the input.":"Adaugă URL-ul media in input.","Tip: Paste the URL into the content to embed faster.":"Sugestie: adaugă URL-ul în conținut pentru a fi adăugat mai rapid.","The URL must not be empty.":"URL-ul nu trebuie să fie gol.","This media URL is not supported.":"Acest URL media nu este suportat.","Insert media":"Inserează media","Media":"Multimedia","Media toolbar":"Bară media","Open media in new tab":"Deschideți conținutul media într-o filă nouă"},getPluralForm(n){return (n==1?0:(((n%100>19)||((n%100==0)&&(n!=0)))?2:1));}}};
e[ 'ro' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ro' ].dictionary = Object.assign( e[ 'ro' ].dictionary, dictionary );
e[ 'ro' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
