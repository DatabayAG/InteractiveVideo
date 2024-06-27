/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
export default {"uk":{"dictionary":{"Font Size":"Розмір шрифту","Tiny":"Крихітний","Small":"Маленький","Big":"Великий","Huge":"Величезний","Font Family":"Сімейство шрифтів","Default":"За замовчуванням","Font Color":"Колір шрифту","Font Background Color":"Колір тла шрифту","Document colors":"Кольори документу"},getPluralForm(n){return (n % 1 == 0 && n % 10 == 1 && n % 100 != 11 ? 0 : n % 1 == 0 && n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : n % 1 == 0 && (n % 10 ==0 || (n % 10 >=5 && n % 10 <=9) || (n % 100 >=11 && n % 100 <=14 )) ? 2: 3);}}}