/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'tk' ]: { dictionary, getPluralForm } } = {"tk":{"dictionary":{"Disable editing":"Redaktirlemegi öçüriň","Enable editing":"Redaktirlemegi işjeňleşdiriň","Previous editable region":"Öňki redaktirläp bolýan sebit","Next editable region":"Indiki redaktirläp bolýan sebit","Navigate editable regions":"Düzedip bolýan sebitlere geçiň"},getPluralForm(n){return (n != 1);}}};
e[ 'tk' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'tk' ].dictionary = Object.assign( e[ 'tk' ].dictionary, dictionary );
e[ 'tk' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
