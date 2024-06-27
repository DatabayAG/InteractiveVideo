/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'lt' ]: { dictionary, getPluralForm } } = {"lt":{"dictionary":{"media widget":"media valdiklis","Media URL":"Media URL","Paste the media URL in the input.":"Įklijuokite media URL adresą į įvedimo lauką.","Tip: Paste the URL into the content to embed faster.":"Patarimas: norėdami greičiau įterpti media tiesiog įklijuokite URL į turinį.","The URL must not be empty.":"URL negali būti tuščias.","This media URL is not supported.":"Šis media URL yra nepalaikomas.","Insert media":"Įterpkite media","Media":"Medija","Media toolbar":"Medijų įrankių juosta","Open media in new tab":"Atidaryti mediją naujame skirtuke"},getPluralForm(n){return (n % 10 == 1 && (n % 100 > 19 || n % 100 < 11) ? 0 : (n % 10 >= 2 && n % 10 <=9) && (n % 100 > 19 || n % 100 < 11) ? 1 : n % 1 != 0 ? 2: 3);}}};
e[ 'lt' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'lt' ].dictionary = Object.assign( e[ 'lt' ].dictionary, dictionary );
e[ 'lt' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
