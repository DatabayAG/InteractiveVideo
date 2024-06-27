/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'az' ]: { dictionary, getPluralForm } } = {"az":{"dictionary":{"Paragraph":"Abzas","Heading":"Başlıq","Choose heading":"Başlıqı seç","Heading 1":"Başlıq 1","Heading 2":"Başlıq 2","Heading 3":"Başlıq 3","Heading 4":"Başlıq 4","Heading 5":"Başlıq 5","Heading 6":"Başlıq 6","Type your title":"Başlığınızı yazın","Type or paste your content here.":""},getPluralForm(n){return (n != 1);}}};
e[ 'az' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'az' ].dictionary = Object.assign( e[ 'az' ].dictionary, dictionary );
e[ 'az' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
