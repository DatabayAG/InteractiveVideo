/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
export default {"pl":{"dictionary":{"Font Size":"Rozmiar czcionki","Tiny":"Bardzo mały","Small":"Mały","Big":"Duży","Huge":"Bardzo duży","Font Family":"Czcionka","Default":"Domyślny","Font Color":"Kolor czcionki","Font Background Color":"Kolor tła czcionki","Document colors":"Kolory dokumentu"},getPluralForm(n){return (n==1 ? 0 : (n%10>=2 && n%10<=4) && (n%100<12 || n%100>14) ? 1 : n!=1 && (n%10>=0 && n%10<=1) || (n%10>=5 && n%10<=9) || (n%100>=12 && n%100<=14) ? 2 : 3);}}}