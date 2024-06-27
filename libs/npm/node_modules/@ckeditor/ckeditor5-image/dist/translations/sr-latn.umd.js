/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'sr-latn' ]: { dictionary, getPluralForm } } = {"sr-latn":{"dictionary":{"image widget":"modul sa slikom","Wrap text":"Prelomiti tekst","Break text":"Prelom teksta","In line":"U redu","Side image":"Bočna slika","Full size image":"Slika u punoj veličini","Left aligned image":"Leva slika","Centered image":"Slika u sredini","Right aligned image":"Desna slika","Change image text alternative":"Izmena alternativnog teksta","Text alternative":"Alternativni tekst","Enter image caption":"Odredi tekst ispod slike","Insert image":"Dodaj sliku","Replace image":"","Upload from computer":"","Replace from computer":"","Upload image from computer":"","Image from computer":"","From computer":"","Replace image from computer":"","Upload failed":"Postavljanje neuspešno","Image toolbar":"Slika traka sa alatkama","Resize image":"Promenite veličinu slike","Resize image to %0":"Promenite veličinu slike na% 0","Resize image to the original size":"Promenite veličinu slike do originalne veličine","Resize image (in %0)":"","Original":"Original","Custom image size":"","Custom":"","Image resize list":"Lista veličine slike","Insert image via URL":"Ubaci sliku preko URL-a","Insert via URL":"","Image via URL":"","Via URL":"","Update image URL":"Ažuriraj URL slike","Caption for the image":"Natpis za sliku","Caption for image: %0":"Natpis za sliku:%0","The value must not be empty.":"","The value should be a plain number.":"","Uploading image":"","Image upload complete":"","Error during image upload":"","Image":""},getPluralForm(n){return (n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);}}};
e[ 'sr-latn' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'sr-latn' ].dictionary = Object.assign( e[ 'sr-latn' ].dictionary, dictionary );
e[ 'sr-latn' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
