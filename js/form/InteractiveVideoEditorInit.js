import {
    ClassicEditor,
    AccessibilityHelp, AutoLink, Autosave, Bold, Essentials, Italic, Link, Paragraph, SelectAll,
    SpecialCharacters, Strikethrough, Subscript, Superscript, Underline, Undo
} from '../../libs/npm/node_modules/ckeditor5/dist/browser/ckeditor5.js';

il.InteractiveVideoEditor = (function (scope) {
    'use strict';

    let pub = {}, pro = {},
        pri = {
            editor_instances: {}
        };

    pub.createMultipleInstances = function (elementIdentifiers) {
        elementIdentifiers.forEach((elementIdentifier) => pub.createInstance(elementIdentifier));
    }

    pub.createInstance = function (elementIdentifier) {
      //Todo: check if this is really needed
        if (! pub.getEditorInstanceById(elementIdentifier)) {
            if (document.getElementById(elementIdentifier)) {
                return ClassicEditor
                    .create(document.querySelector('#' + elementIdentifier), pri.getEditorConfig())
                    .then(editor => {
                        pri.editor_instances[elementIdentifier] = editor;
                        editor.editing.view.change(writer => {
                            writer.setStyle('min-height', '75px', editor.editing.view.document.getRoot());
                        });
                    })
                    .catch(err => console.error(err.stack));
            }
        }
    }

    pub.getEditorInstanceById = function (elementIdentifier) {
        if (pub.getEditorInstancesCount() >= 1) {
            if (typeof pri.editor_instances[elementIdentifier] != "undefined") {
                return pri.editor_instances[elementIdentifier];
            }
        }

        return false;
    }

    pub.getEditorInstancesCount = function () {
        return Object.keys(pub.getEditorInstances()).length;
    }

    pub.getEditorInstances = function () {
        return pri.editor_instances;
    }

    pri.getEditorConfig = function () {
        return {
            toolbar: {
                items: [
                    'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
                    '|', 'link', '|', 'accessibilityHelp'
                ],
                shouldNotGroupWhenFull: false
            },
            plugins: [
                AccessibilityHelp, AutoLink, Autosave, Bold, Essentials, Italic, Link, Paragraph, SelectAll,
                SpecialCharacters, Strikethrough, Subscript, Superscript, Underline, Undo
            ],
            link: {
                addTargetToExternalLinks: true,
                defaultProtocol: 'https://'
            },
            placeholder: ''
        };
    }
    pub.protect = pro;
    return pub;

}(il));
