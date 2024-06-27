/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'bn' ]: { dictionary, getPluralForm } } = {"bn":{"dictionary":{"Disable editing":"সম্পাদনা নিষ্ক্রিয় করুন","Enable editing":"সম্পাদনা সক্রিয় করুন","Previous editable region":"পূর্ববর্তী সম্পাদনাযোগ্য অংশ","Next editable region":"পরবর্তী সম্পাদনাযোগ্য অংশ","Navigate editable regions":"সম্পাদনাযোগ্য অংশে নেভিগেট করুন"},getPluralForm(n){return (n != 1);}}};
e[ 'bn' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'bn' ].dictionary = Object.assign( e[ 'bn' ].dictionary, dictionary );
e[ 'bn' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
