import {
    ClassicEditor,
    AccessibilityHelp,
    AutoLink,
    Autosave,
    Bold,
    Essentials,
    Italic,
    Link,
    Paragraph,
    SelectAll,
    SpecialCharacters,
    Strikethrough,
    Subscript,
    Superscript,
    Underline,
    Undo
} from '../../libs/npm/node_modules/ckeditor5/dist/browser/ckeditor5.js';

//import '../../libs/npm/node_modules/ckeditor5/dist/ckeditor5.css';

//import './style.css';

const editorConfig = {
    toolbar: {
        items: [
            'undo',
            'redo',
            '|',
            'selectAll',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            '|',
            'specialCharacters',
            'link',
            '|',
            'accessibilityHelp'
        ],
        shouldNotGroupWhenFull: false
    },
    plugins: [
        AccessibilityHelp,
        AutoLink,
        Autosave,
        Bold,
        Essentials,
        Italic,
        Link,
        Paragraph,
        SelectAll,
        SpecialCharacters,
        Strikethrough,
        Subscript,
        Superscript,
        Underline,
        Undo
    ],
    link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
            toggleDownloadable: {
                mode: 'manual',
                label: 'Downloadable',
                attributes: {
                    download: 'file'
                }
            }
        }
    },
    placeholder: 'Type or paste your content here!'
};

il.InteractiveVideoEditor = (function (scope) {
    'use strict';

    var pub = {}, pro = {}, pri = {iv_text_editors : {}};

    pub.createInstance = function(elementIdentifier) {
        return ClassicEditor
            .create( document.querySelector( elementIdentifier ), editorConfig)
            .then( editor => {
                pri.iv_text_editors[ elementIdentifier ] = editor;
            } )
            .catch( err => console.error( err.stack ) );
    }

    pub.getEditorInstanceById = function (elementId)
    {
        return pri.iv_text_editors['#' + elementId];
    }

    pub.getEditorInstances = function ()
    {
        return pri.iv_text_editors;
    }
    pub.protect = pro;
    return pub;

}(il));

//ClassicEditor.create(document.querySelector('.comment_text_iv_field'), editorConfig);