/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'el' ]: { dictionary, getPluralForm } } = {"el":{"dictionary":{"Disable editing":"Απενεργοποίηση επεξεργασίας","Enable editing":"Ενεργοποίηση επεξεργασίας","Previous editable region":"Προηγούμενη επεξεργάσιμη περιοχή","Next editable region":"Επόμενη επεξεργάσιμη περιοχή","Navigate editable regions":"Πλοήγηση στις επεξεργάσιμες περιοχές"},getPluralForm(n){return (n != 1);}}};
e[ 'el' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'el' ].dictionary = Object.assign( e[ 'el' ].dictionary, dictionary );
e[ 'el' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
