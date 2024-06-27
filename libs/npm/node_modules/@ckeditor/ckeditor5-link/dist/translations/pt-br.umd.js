/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'pt-br' ]: { dictionary, getPluralForm } } = {"pt-br":{"dictionary":{"Unlink":"Remover link","Link":"Link","Link URL":"URL do link","Link URL must not be empty.":"O URL do link não pode estar vazio.","Link image":"Link com imagem","Edit link":"Editar link","Open link in new tab":"Abrir link em nova aba","This link has no URL":"Este link não possui uma URL","Open in a new tab":"Abrir em nova aba","Downloadable":"Pode ser baixado","Create link":"Criar link","Move out of a link":"Sair de um link"},getPluralForm(n){return (n == 0 || n == 1) ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'pt-br' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'pt-br' ].dictionary = Object.assign( e[ 'pt-br' ].dictionary, dictionary );
e[ 'pt-br' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
