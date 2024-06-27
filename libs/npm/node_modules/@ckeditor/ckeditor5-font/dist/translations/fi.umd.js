/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'fi' ]: { dictionary, getPluralForm } } = {"fi":{"dictionary":{"Font Size":"Fontin koko","Tiny":"Hyvin pieni","Small":"Pieni","Big":"Suuri","Huge":"Hyvin suuri","Font Family":"Fonttiperhe","Default":"Oletus","Font Color":"Fontin väri","Font Background Color":"Fontin taustaväri","Document colors":"Asiakirjan värit"},getPluralForm(n){return (n != 1);}}};
e[ 'fi' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'fi' ].dictionary = Object.assign( e[ 'fi' ].dictionary, dictionary );
e[ 'fi' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
