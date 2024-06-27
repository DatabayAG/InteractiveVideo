/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'fr' ]: { dictionary, getPluralForm } } = {"fr":{"dictionary":{"Find and replace":"Rechercher et remplacer","Find in text…":"Rechercher dans le texte...","Find":"Rechercher","Previous result":"Résultat précédent","Next result":"Résultat suivant","Replace":"Remplacer","Replace all":"Remplacer tout","Match case":"Sensible à la casse","Whole words only":"Mots entiers uniquement","Replace with…":"Remplacer par ...","Text to find must not be empty.":"L'expression à rechercher ne doit pas être vide","Tip: Find some text first in order to replace it.":"Astuce : rechercher une expression afin de la remplacer","Advanced options":"Options avancées","Find in the document":"Rechercher dans le document"},getPluralForm(n){return (n == 0 || n == 1) ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'fr' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'fr' ].dictionary = Object.assign( e[ 'fr' ].dictionary, dictionary );
e[ 'fr' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
