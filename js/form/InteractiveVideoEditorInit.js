import {
    ClassicEditor,
    AccessibilityHelp, AutoLink, Autosave, Bold, Essentials, Italic, Link, Paragraph, SelectAll,
    SpecialCharacters, Strikethrough, Subscript, Superscript, Underline, Undo
} from '../../libs/npm/node_modules/ckeditor5/dist/browser/ckeditor5.js';

il.InteractiveVideoEditor = (function (scope) {
    'use strict';

    let pub = {}, pro = {},
        pri = {
            editor_instances: {},
            editor_instances_init: {}
        };

    pub.createMultipleInstances = function (elementIdentifiers) {
        elementIdentifiers.forEach((elementIdentifier) => pub.createInstance(elementIdentifier));
    }

    pub.createInstance = function (elementIdentifier) {
      console.log(elementIdentifier, pri.editor_instances);
        if (elementIdentifier.startsWith('text_reflection_comment_') || ! pri.editorInitialized(elementIdentifier)) {
            if (document.getElementById(elementIdentifier)) {
                pri.editor_instances_init[elementIdentifier] = true;
                return ClassicEditor
                    .create(document.querySelector('#' + elementIdentifier), pri.getEditorConfig())
                    .then(editor => {
                        pri.editor_instances[elementIdentifier] = editor;
                        editor.editing.view.change(writer => {
                            writer.setStyle('min-height', '75px', editor.editing.view.document.getRoot());
                        });
                        pri.shieldBodyWrapperFromModalFocusTrap();
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

    // CKEditor renders balloons (e.g. the link form) into a wrapper attached to <body>. The Bootstrap modal
    // focus trap reacts to focusin outside the modal and pulls focus back, which closes the balloon at once.
    pri.shieldBodyWrapperFromModalFocusTrap = function () {
        const wrapper = document.querySelector('.ck-body-wrapper');
        if (wrapper && !wrapper.dataset.xvidFocusShield) {
            wrapper.dataset.xvidFocusShield = '1';
            wrapper.addEventListener('focusin', event => event.stopPropagation());
        }
    }

     pri.editorInitialized = function (elementIdentifier) {
            if (typeof pri.editor_instances_init[elementIdentifier] != "undefined") {
                return pri.editor_instances_init[elementIdentifier];
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
