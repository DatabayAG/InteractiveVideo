/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'fr' ]: { dictionary, getPluralForm } } = {"fr":{"dictionary":{"Bold":"Gras","Italic":"Italique","Underline":"Souligné","Code":"Code","Strikethrough":"Barré","Subscript":"Indice","Superscript":"Exposant","Italic text":"Texte en italique","Move out of an inline code style":"Sortir d'un style de code en ligne","Bold text":"Texte en gras","Underline text":"Souligner le texte","Strikethrough text":"Texte barré"},getPluralForm(n){return (n == 0 || n == 1) ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'fr' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'fr' ].dictionary = Object.assign( e[ 'fr' ].dictionary, dictionary );
e[ 'fr' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
