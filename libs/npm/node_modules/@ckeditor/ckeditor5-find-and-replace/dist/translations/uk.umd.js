/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'uk' ]: { dictionary, getPluralForm } } = {"uk":{"dictionary":{"Find and replace":"Знайти та замінити","Find in text…":"Знайти в тексті…","Find":"Знайти","Previous result":"Попередній результат","Next result":"Наступний результат","Replace":"Замінити","Replace all":"Замінити все","Match case":"Врахувати регістр","Whole words only":"Тільки цілі слова","Replace with…":"Замінити…","Text to find must not be empty.":"Текст для пошуку не повинен бути порожнім.","Tip: Find some text first in order to replace it.":"Порада: спочатку знайдіть текст, щоб замінити його.","Advanced options":"Розширені опції","Find in the document":"Пошук в документі"},getPluralForm(n){return (n % 1 == 0 && n % 10 == 1 && n % 100 != 11 ? 0 : n % 1 == 0 && n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : n % 1 == 0 && (n % 10 ==0 || (n % 10 >=5 && n % 10 <=9) || (n % 100 >=11 && n % 100 <=14 )) ? 2: 3);}}};
e[ 'uk' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'uk' ].dictionary = Object.assign( e[ 'uk' ].dictionary, dictionary );
e[ 'uk' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
