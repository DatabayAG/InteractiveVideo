/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
export default {"lt":{"dictionary":{"Font Size":"Šrifto dydis","Tiny":"Mažytis","Small":"Mažas","Big":"Didelis","Huge":"Milžiniškas","Font Family":"Šrifto šeima","Default":"Numatyta","Font Color":"Šrifto spalva","Font Background Color":"Šrifto fono spalva","Document colors":"Dokumento spalvos"},getPluralForm(n){return (n % 10 == 1 && (n % 100 > 19 || n % 100 < 11) ? 0 : (n % 10 >= 2 && n % 10 <=9) && (n % 100 > 19 || n % 100 < 11) ? 1 : n % 1 != 0 ? 2: 3);}}}