# ckeditor5-mathtype

Ckeditor5 build classic with support of mathtype plugin.

## Installation

Install the plugin with NPM or Yarn

```bash
npm install ckeditor5-mathtype

OR

yarn add ckeditor5-mathtype
```

## Usage

```javascript
import "ckeditor5-mathtype/build/ckeditor";

ClassicEditor.create( document.querySelector( '#editor' ) )
 .then(editor => {
    window.editor = editor;
  })
 .catch(error => {
    console.error( 'There was a problem initializing the editor.', error );
 });
```
If using with CKEditor with react

First install @ckeditor/ckeditor5-react
```
npm install @ckeditor/ckeditor5-react

OR

yarn add @ckeditor/ckeditor5-react
```

```
import CKEditor from "@ckeditor/ckeditor5-react";
const ClassicEditor = require("ckeditor5-mathtype/build/ckeditor");

<CKEditor
 editor={ClassicEditor}
 data={value}
 onInit={editor => { 
  // do something
 }}
 onChange={(event, editor) => {
  // do something
 }}
/>
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update the tests as appropriate.