/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ru' ]: { dictionary, getPluralForm } } = {"ru":{"dictionary":{"Find and replace":"Найти и заменить","Find in text…":"Найти в тексте","Find":"Найти","Previous result":"Предыдущий результат","Next result":"Следующий результат","Replace":"Заменить","Replace all":"Заменить всё","Match case":"С учетом регистра","Whole words only":"Только слова целиком","Replace with…":"Заменить на...","Text to find must not be empty.":"Искомый текст не должен быть пустым.","Tip: Find some text first in order to replace it.":"Совет: сначала найдите текст, чтобы заменить его.","Advanced options":"Дополнительные параметры","Find in the document":"Найти в документе"},getPluralForm(n){return (n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : n%10==0 || (n%10>=5 && n%10<=9) || (n%100>=11 && n%100<=14)? 2 : 3);}}};
e[ 'ru' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ru' ].dictionary = Object.assign( e[ 'ru' ].dictionary, dictionary );
e[ 'ru' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
