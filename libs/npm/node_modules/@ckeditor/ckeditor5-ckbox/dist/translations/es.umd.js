/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'es' ]: { dictionary, getPluralForm } } = {"es":{"dictionary":{"Open file manager":"Abrir gestor de archivos","Cannot determine a category for the uploaded file.":"No se puede determinar una categoría para el archivo subido.","Cannot access default workspace.":"No se puede acceder al espacio de trabajo predeterminado.","Edit image":"Editar imagen","Processing the edited image.":"Procesando la imagen editada.","Server failed to process the image.":"El servidor no pudo procesar la imagen.","Failed to determine category of edited image.":"No se pudo determinar la categoría de la imagen editada."},getPluralForm(n){return n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;}}};
e[ 'es' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'es' ].dictionary = Object.assign( e[ 'es' ].dictionary, dictionary );
e[ 'es' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
