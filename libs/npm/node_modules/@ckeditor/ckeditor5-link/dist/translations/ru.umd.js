/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ru' ]: { dictionary, getPluralForm } } = {"ru":{"dictionary":{"Unlink":"Убрать ссылку","Link":"Ссылка","Link URL":"Ссылка URL","Link URL must not be empty.":"URL-адрес ссылки не должен быть пустым.","Link image":"Ссылка на изображение","Edit link":"Редактировать ссылку","Open link in new tab":"Открыть ссылку в новой вкладке","This link has no URL":"Для этой ссылки не установлен адрес URL","Open in a new tab":"Открыть в новой вкладке","Downloadable":"Загружаемые","Create link":"Создать ссылку","Move out of a link":"Выйти из ссылки"},getPluralForm(n){return (n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : n%10==0 || (n%10>=5 && n%10<=9) || (n%100>=11 && n%100<=14)? 2 : 3);}}};
e[ 'ru' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ru' ].dictionary = Object.assign( e[ 'ru' ].dictionary, dictionary );
e[ 'ru' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
