/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'pl' ]: { dictionary, getPluralForm } } = {"pl":{"dictionary":{"Open file manager":"Otwórz menedżer plików","Cannot determine a category for the uploaded file.":"Nie można ustalić kategorii przesłanego pliku.","Cannot access default workspace.":"Nie można uzyskać dostępu do domyślnego obszaru roboczego.","Edit image":"Edytuj obraz","Processing the edited image.":"Trwa przetwarzanie edytowanego obrazu.","Server failed to process the image.":"Serwer nie mógł przetworzyć obrazu.","Failed to determine category of edited image.":"Nie udało się określić kategorii edytowanego obrazu."},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}};
e[ 'pl' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'pl' ].dictionary = Object.assign( e[ 'pl' ].dictionary, dictionary );
e[ 'pl' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
