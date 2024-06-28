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

il.InteractiveVideoEditor = (function (scope) {
    'use strict';

    let pub = {}, pro = {}, pri = {txt_editor_instances : {}};

    pub.createInstance = function(elementIdentifier) {
        return ClassicEditor
            .create( document.querySelector( elementIdentifier ), pri.getCKEditorConfig())
            .then( editor => {
                pri.txt_editor_instances[ elementIdentifier ] = editor;
            } )
            .catch( err => console.error( err.stack ) );
    }

    pub.getEditorInstanceById = function (elementId)
    {
        if(pub.getEditorInstancesCount() > 1) {
            if (typeof pri.txt_editor_instances['#' + elementId] != "undefined") {
                return pri.txt_editor_instances['#' + elementId];
            }
        }

        return false;
    }

    pub.getEditorInstancesCount = function () {
        return Object.keys(pri.txt_editor_instances).length;
    }

    pub.getEditorInstances = function ()
    {
        return pri.txt_editor_instances;
    }

    pri.getCKEditorConfig = function()
    {
        return {
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
    }
    pub.protect = pro;
    return pub;

}(il));

//ClassicEditor.create(document.querySelector('.comment_text_iv_field'), editorConfig);