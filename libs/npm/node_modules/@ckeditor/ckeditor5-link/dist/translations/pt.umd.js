/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'pt' ]: { dictionary, getPluralForm } } = {"pt":{"dictionary":{"Unlink":"Desligar","Link":"Hiperligação","Link URL":"URL da ligação","Link URL must not be empty.":"O URL da ligação não pode estar em branco.","Link image":"Imagem da hiperligação","Edit link":"Editar hiperligação","Open link in new tab":"Abrir hiperligação num novo separador","This link has no URL":"Esta hiperligação não tem URL","Open in a new tab":"Abrir num novo separador","Downloadable":"Descarregável","Create link":"Criar ligação","Move out of a link":"Sair de uma ligação"},getPluralForm(n){return (n == 0 || n == 1) ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'pt' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'pt' ].dictionary = Object.assign( e[ 'pt' ].dictionary, dictionary );
e[ 'pt' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
