/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'cs' ]: { dictionary, getPluralForm } } = {"cs":{"dictionary":{"Insert image or file":"Vložit obrázek nebo soubor","Could not obtain resized image URL.":"Nelze získat URL obrázku se změněnou velikostí.","Selecting resized image failed":"Výběr obrázku se změněnou velikostí selhal","Could not insert image at the current position.":"Na současnou pozici nelze vložit obrázek.","Inserting image failed":"Vložení obrázku selhalo"},getPluralForm(n){return (n == 1 && n % 1 == 0) ? 0 : (n >= 2 && n <= 4 && n % 1 == 0) ? 1: (n % 1 != 0 ) ? 2 : 3;}}};
e[ 'cs' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'cs' ].dictionary = Object.assign( e[ 'cs' ].dictionary, dictionary );
e[ 'cs' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
