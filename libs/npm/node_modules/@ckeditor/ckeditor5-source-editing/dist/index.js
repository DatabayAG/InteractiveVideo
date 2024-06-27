/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin, PendingActions } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { ElementReplacer, CKEditorError, createElement } from '@ckeditor/ckeditor5-utils/dist/index.js';

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module source-editing/utils/formathtml
 */ /**
 * A simple (and naive) HTML code formatter that returns a formatted HTML markup that can be easily
 * parsed by human eyes. It beautifies the HTML code by adding new lines between elements that behave like block elements
 * (https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
 * and a few more like `tr`, `td`, and similar ones) and inserting indents for nested content.
 *
 * WARNING: This function works only on a text that does not contain any indentations or new lines.
 * Calling this function on the already formatted text will damage the formatting.
 *
 * @param input An HTML string to format.
 */ function formatHtml(input) {
    // A list of block-like elements around which the new lines should be inserted, and within which
    // the indentation of their children should be increased.
    // The list is partially based on https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements that contains
    // a full list of HTML block-level elements.
    // A void element is an element that cannot have any child - https://html.spec.whatwg.org/multipage/syntax.html#void-elements.
    // Note that <pre> element is not listed on this list to avoid breaking whitespace formatting.
    // Note that <br> element is not listed and handled separately so no additional white spaces are injected.
    const elementsToFormat = [
        {
            name: 'address',
            isVoid: false
        },
        {
            name: 'article',
            isVoid: false
        },
        {
            name: 'aside',
            isVoid: false
        },
        {
            name: 'blockquote',
            isVoid: false
        },
        {
            name: 'details',
            isVoid: false
        },
        {
            name: 'dialog',
            isVoid: false
        },
        {
            name: 'dd',
            isVoid: false
        },
        {
            name: 'div',
            isVoid: false
        },
        {
            name: 'dl',
            isVoid: false
        },
        {
            name: 'dt',
            isVoid: false
        },
        {
            name: 'fieldset',
            isVoid: false
        },
        {
            name: 'figcaption',
            isVoid: false
        },
        {
            name: 'figure',
            isVoid: false
        },
        {
            name: 'footer',
            isVoid: false
        },
        {
            name: 'form',
            isVoid: false
        },
        {
            name: 'h1',
            isVoid: false
        },
        {
            name: 'h2',
            isVoid: false
        },
        {
            name: 'h3',
            isVoid: false
        },
        {
            name: 'h4',
            isVoid: false
        },
        {
            name: 'h5',
            isVoid: false
        },
        {
            name: 'h6',
            isVoid: false
        },
        {
            name: 'header',
            isVoid: false
        },
        {
            name: 'hgroup',
            isVoid: false
        },
        {
            name: 'hr',
            isVoid: true
        },
        {
            name: 'li',
            isVoid: false
        },
        {
            name: 'main',
            isVoid: false
        },
        {
            name: 'nav',
            isVoid: false
        },
        {
            name: 'ol',
            isVoid: false
        },
        {
            name: 'p',
            isVoid: false
        },
        {
            name: 'section',
            isVoid: false
        },
        {
            name: 'table',
            isVoid: false
        },
        {
            name: 'tbody',
            isVoid: false
        },
        {
            name: 'td',
            isVoid: false
        },
        {
            name: 'th',
            isVoid: false
        },
        {
            name: 'thead',
            isVoid: false
        },
        {
            name: 'tr',
            isVoid: false
        },
        {
            name: 'ul',
            isVoid: false
        }
    ];
    const elementNamesToFormat = elementsToFormat.map((element)=>element.name).join('|');
    // It is not the fastest way to format the HTML markup but the performance should be good enough.
    const lines = input// Add new line before and after `<tag>` and `</tag>`.
    // It may separate individual elements with two new lines, but this will be fixed below.
    .replace(new RegExp(`</?(${elementNamesToFormat})( .*?)?>`, 'g'), '\n$&\n')// Keep `<br>`s at the end of line to avoid adding additional whitespaces before `<br>`.
    .replace(/<br[^>]*>/g, '$&\n')// Divide input string into lines, which start with either an opening tag, a closing tag, or just a text.
    .split('\n');
    let indentCount = 0;
    let isPreformattedLine = false;
    return lines.filter((line)=>line.length).map((line)=>{
        isPreformattedLine = isPreformattedBlockLine(line, isPreformattedLine);
        if (isNonVoidOpeningTag(line, elementsToFormat)) {
            return indentLine(line, indentCount++);
        }
        if (isClosingTag(line, elementsToFormat)) {
            return indentLine(line, --indentCount);
        }
        if (isPreformattedLine === 'middle' || isPreformattedLine === 'last') {
            return line;
        }
        return indentLine(line, indentCount);
    }).join('\n');
}
/**
 * Checks, if an argument is an opening tag of a non-void element to be formatted.
 *
 * @param line String to check.
 * @param elementsToFormat Elements to be formatted.
 */ function isNonVoidOpeningTag(line, elementsToFormat) {
    return elementsToFormat.some((element)=>{
        if (element.isVoid) {
            return false;
        }
        if (!new RegExp(`<${element.name}( .*?)?>`).test(line)) {
            return false;
        }
        return true;
    });
}
/**
 * Checks, if an argument is a closing tag.
 *
 * @param line String to check.
 * @param elementsToFormat Elements to be formatted.
 */ function isClosingTag(line, elementsToFormat) {
    return elementsToFormat.some((element)=>{
        return new RegExp(`</${element.name}>`).test(line);
    });
}
/**
 * Indents a line by a specified number of characters.
 *
 * @param line Line to indent.
 * @param indentCount Number of characters to use for indentation.
 * @param indentChar Indentation character(s). 4 spaces by default.
 */ function indentLine(line, indentCount, indentChar = '    ') {
    // More about Math.max() here in https://github.com/ckeditor/ckeditor5/issues/10698.
    return `${indentChar.repeat(Math.max(0, indentCount))}${line}`;
}
/**
 * Checks whether a line belongs to a preformatted (`<pre>`) block.
 *
 * @param line Line to check.
 * @param isPreviousLinePreFormatted Information on whether the previous line was preformatted (and how).
 */ function isPreformattedBlockLine(line, isPreviousLinePreFormatted) {
    if (new RegExp('<pre( .*?)?>').test(line)) {
        return 'first';
    } else if (new RegExp('</pre>').test(line)) {
        return 'last';
    } else if (isPreviousLinePreFormatted === 'first' || isPreviousLinePreFormatted === 'middle') {
        return 'middle';
    } else {
        return false;
    }
}

var sourceEditingIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m12.5 0 5 4.5v15.003h-16V0h11zM3 1.5v3.25l-1.497 1-.003 8 1.5 1v3.254L7.685 18l-.001 1.504H17.5V8.002L16 9.428l-.004-4.22-4.222-3.692L3 1.5z\"/><path d=\"M4.06 6.64a.75.75 0 0 1 .958 1.15l-.085.07L2.29 9.75l2.646 1.89c.302.216.4.62.232.951l-.058.095a.75.75 0 0 1-.951.232l-.095-.058-3.5-2.5V9.14l3.496-2.5zm4.194 6.22a.75.75 0 0 1-.958-1.149l.085-.07 2.643-1.89-2.646-1.89a.75.75 0 0 1-.232-.952l.058-.095a.75.75 0 0 1 .95-.232l.096.058 3.5 2.5v1.22l-3.496 2.5zm7.644-.836 2.122 2.122-5.825 5.809-2.125-.005.003-2.116zm2.539-1.847 1.414 1.414a.5.5 0 0 1 0 .707l-1.06 1.06-2.122-2.12 1.061-1.061a.5.5 0 0 1 .707 0z\"/></svg>";

const COMMAND_FORCE_DISABLE_ID = 'SourceEditingMode';
/**
 * The source editing feature.
 *
 * It provides the possibility to view and edit the source of the document.
 *
 * For a detailed overview, check the {@glink features/source-editing source editing feature documentation} and the
 * {@glink api/source-editing package page}.
 */ class SourceEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SourceEditing';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            PendingActions
        ];
    }
    /**
	 * The element replacer instance used to replace the editing roots with the wrapper elements containing the document source.
	 */ _elementReplacer;
    /**
	 * Maps all root names to wrapper elements containing the document source.
	 */ _replacedRoots;
    /**
	 * Maps all root names to their document data.
	 */ _dataFromRoots;
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        this.set('isSourceEditingMode', false);
        this._elementReplacer = new ElementReplacer();
        this._replacedRoots = new Map();
        this._dataFromRoots = new Map();
        editor.config.define('sourceEditing.allowCollaborationFeatures', false);
    }
    /**
	 * @inheritDoc
	 */ init() {
        this._checkCompatibility();
        const editor = this.editor;
        const t = editor.locale.t;
        editor.ui.componentFactory.add('sourceEditing', ()=>{
            const buttonView = this._createButton(ButtonView);
            buttonView.set({
                label: t('Source'),
                icon: sourceEditingIcon,
                tooltip: true,
                class: 'ck-source-editing-button'
            });
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:sourceEditing', ()=>{
            const buttonView = this._createButton(MenuBarMenuListItemButtonView);
            buttonView.set({
                label: t('Show source')
            });
            return buttonView;
        });
        // Currently, the plugin handles the source editing mode by itself only for the classic editor. To use this plugin with other
        // integrations, listen to the `change:isSourceEditingMode` event and act accordingly.
        if (this._isAllowedToHandleSourceEditingMode()) {
            this.on('change:isSourceEditingMode', (evt, name, isSourceEditingMode)=>{
                if (isSourceEditingMode) {
                    this._hideVisibleDialog();
                    this._showSourceEditing();
                    this._disableCommands();
                } else {
                    this._hideSourceEditing();
                    this._enableCommands();
                }
            });
            this.on('change:isEnabled', (evt, name, isEnabled)=>this._handleReadOnlyMode(!isEnabled));
            this.listenTo(editor, 'change:isReadOnly', (evt, name, isReadOnly)=>this._handleReadOnlyMode(isReadOnly));
        }
        // Update the editor data while calling editor.getData() in the source editing mode.
        editor.data.on('get', ()=>{
            if (this.isSourceEditingMode) {
                this.updateEditorData();
            }
        }, {
            priority: 'high'
        });
    }
    /**
	 * Updates the source data in all hidden editing roots.
	 */ updateEditorData() {
        const editor = this.editor;
        const data = {};
        for (const [rootName, domSourceEditingElementWrapper] of this._replacedRoots){
            const oldData = this._dataFromRoots.get(rootName);
            const newData = domSourceEditingElementWrapper.dataset.value;
            // Do not set the data unless some changes have been made in the meantime.
            // This prevents empty undo steps after switching to the normal editor.
            if (oldData !== newData) {
                data[rootName] = newData;
                this._dataFromRoots.set(rootName, newData);
            }
        }
        if (Object.keys(data).length) {
            editor.data.set(data, {
                batchType: {
                    isUndoable: true
                },
                suppressErrorInCollaboration: true
            });
        }
    }
    _checkCompatibility() {
        const editor = this.editor;
        const allowCollaboration = editor.config.get('sourceEditing.allowCollaborationFeatures');
        if (!allowCollaboration && editor.plugins.has('RealTimeCollaborativeEditing')) {
            /**
			 * Source editing feature is not fully compatible with real-time collaboration,
			 * and using it may lead to data loss. Please read
			 * {@glink features/source-editing#limitations-and-incompatibilities source editing feature guide} to learn more.
			 *
			 * If you understand the possible risk of data loss, you can enable the source editing
			 * by setting the
			 * {@link module:source-editing/sourceeditingconfig~SourceEditingConfig#allowCollaborationFeatures}
			 * configuration flag to `true`.
			 *
			 * @error source-editing-incompatible-with-real-time-collaboration
			 */ throw new CKEditorError('source-editing-incompatible-with-real-time-collaboration', null);
        }
        const collaborationPluginNamesToWarn = [
            'CommentsEditing',
            'TrackChangesEditing',
            'RevisionHistory'
        ];
        // Currently, the basic integration with Collaboration Features is to display a warning in the console.
        //
        // If `allowCollaboration` flag is set, do not show these warnings. If the flag is set, we assume that the integrator read
        // appropriate section of the guide so there's no use to spam the console with warnings.
        //
        if (!allowCollaboration && collaborationPluginNamesToWarn.some((pluginName)=>editor.plugins.has(pluginName))) {
            console.warn('You initialized the editor with the source editing feature and at least one of the collaboration features. ' + 'Please be advised that the source editing feature may not work, and be careful when editing document source ' + 'that contains markers created by the collaboration features.');
        }
        // Restricted Editing integration can also lead to problems. Warn the user accordingly.
        if (editor.plugins.has('RestrictedEditingModeEditing')) {
            console.warn('You initialized the editor with the source editing feature and restricted editing feature. ' + 'Please be advised that the source editing feature may not work, and be careful when editing document source ' + 'that contains markers created by the restricted editing feature.');
        }
    }
    /**
	 * Creates source editing wrappers that replace each editing root. Each wrapper contains the document source from the corresponding
	 * root.
	 *
	 * The wrapper element contains a textarea and it solves the problem, that the textarea element cannot auto expand its height based on
	 * the content it contains. The solution is to make the textarea more like a plain div element, which expands in height as much as it
	 * needs to, in order to display the whole document source without scrolling. The wrapper element is a parent for the textarea and for
	 * the pseudo-element `::after`, that replicates the look, content, and position of the textarea. The pseudo-element replica is hidden,
	 * but it is styled to be an identical visual copy of the textarea with the same content. Then, the wrapper is a grid container and both
	 * of its children (the textarea and the `::after` pseudo-element) are positioned within a CSS grid to occupy the same grid cell. The
	 * content in the pseudo-element `::after` is set in CSS and it stretches the grid to the appropriate size based on the textarea value.
	 * Since both children occupy the same grid cell, both have always the same height.
	 */ _showSourceEditing() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        const model = editor.model;
        model.change((writer)=>{
            writer.setSelection(null);
            writer.removeSelectionAttribute(model.document.selection.getAttributeKeys());
        });
        // It is not needed to iterate through all editing roots, as currently the plugin supports only the Classic Editor with a single
        // main root, but this code may help understand and use this feature in external integrations.
        for (const [rootName, domRootElement] of editingView.domRoots){
            const data = formatSource(editor.data.get({
                rootName
            }));
            const domSourceEditingElementTextarea = createElement(domRootElement.ownerDocument, 'textarea', {
                rows: '1',
                'aria-label': 'Source code editing area'
            });
            const domSourceEditingElementWrapper = createElement(domRootElement.ownerDocument, 'div', {
                class: 'ck-source-editing-area',
                'data-value': data
            }, [
                domSourceEditingElementTextarea
            ]);
            domSourceEditingElementTextarea.value = data;
            // Setting a value to textarea moves the input cursor to the end. We want the selection at the beginning.
            domSourceEditingElementTextarea.setSelectionRange(0, 0);
            // Bind the textarea's value to the wrapper's `data-value` property. Each change of the textarea's value updates the
            // wrapper's `data-value` property.
            domSourceEditingElementTextarea.addEventListener('input', ()=>{
                domSourceEditingElementWrapper.dataset.value = domSourceEditingElementTextarea.value;
                editor.ui.update();
            });
            editingView.change((writer)=>{
                const viewRoot = editingView.document.getRoot(rootName);
                writer.addClass('ck-hidden', viewRoot);
            });
            // Register the element so it becomes available for Alt+F10 and Esc navigation.
            editor.ui.setEditableElement('sourceEditing:' + rootName, domSourceEditingElementTextarea);
            this._replacedRoots.set(rootName, domSourceEditingElementWrapper);
            this._elementReplacer.replace(domRootElement, domSourceEditingElementWrapper);
            this._dataFromRoots.set(rootName, data);
        }
        this._focusSourceEditing();
    }
    /**
	 * Restores all hidden editing roots and sets the source data in them.
	 */ _hideSourceEditing() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        this.updateEditorData();
        editingView.change((writer)=>{
            for (const [rootName] of this._replacedRoots){
                writer.removeClass('ck-hidden', editingView.document.getRoot(rootName));
            }
        });
        this._elementReplacer.restore();
        this._replacedRoots.clear();
        this._dataFromRoots.clear();
        editingView.focus();
    }
    /**
	 * Focuses the textarea containing document source from the first editing root.
	 */ _focusSourceEditing() {
        const editor = this.editor;
        const [domSourceEditingElementWrapper] = this._replacedRoots.values();
        const textarea = domSourceEditingElementWrapper.querySelector('textarea');
        // The FocusObserver was disabled by View.render() while the DOM root was getting hidden and the replacer
        // revealed the textarea. So it couldn't notice that the DOM root got blurred in the process.
        // Let's sync this state manually here because otherwise Renderer will attempt to render selection
        // in an invisible DOM root.
        editor.editing.view.document.isFocused = false;
        textarea.focus();
    }
    /**
	 * Disables all commands.
	 */ _disableCommands() {
        const editor = this.editor;
        for (const command of editor.commands.commands()){
            command.forceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
        // Comments archive UI plugin will be disabled manually too.
        if (editor.plugins.has('CommentsArchiveUI')) {
            editor.plugins.get('CommentsArchiveUI').forceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
    }
    /**
	 * Clears forced disable for all commands, that was previously set through {@link #_disableCommands}.
	 */ _enableCommands() {
        const editor = this.editor;
        for (const command of editor.commands.commands()){
            command.clearForceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
        // Comments archive UI plugin will be enabled manually too.
        if (editor.plugins.has('CommentsArchiveUI')) {
            editor.plugins.get('CommentsArchiveUI').clearForceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
    }
    /**
	 * Adds or removes the `readonly` attribute from the textarea from all roots, if document source mode is active.
	 *
	 * @param isReadOnly Indicates whether all textarea elements should be read-only.
	 */ _handleReadOnlyMode(isReadOnly) {
        if (!this.isSourceEditingMode) {
            return;
        }
        for (const [, domSourceEditingElementWrapper] of this._replacedRoots){
            domSourceEditingElementWrapper.querySelector('textarea').readOnly = isReadOnly;
        }
    }
    /**
	 * Checks, if the plugin is allowed to handle the source editing mode by itself. Currently, the source editing mode is supported only
	 * for the {@link module:editor-classic/classiceditor~ClassicEditor classic editor}.
	 */ _isAllowedToHandleSourceEditingMode() {
        const editor = this.editor;
        const editable = editor.ui.view.editable;
        // Checks, if the editor's editable belongs to the editor's DOM tree.
        return editable && !editable.hasExternalElement;
    }
    /**
	 * If any {@link module:ui/dialog/dialogview~DialogView editor dialog} is currently visible, hide it.
	 */ _hideVisibleDialog() {
        if (this.editor.plugins.has('Dialog')) {
            const dialogPlugin = this.editor.plugins.get('Dialog');
            if (dialogPlugin.isOpen) {
                dialogPlugin.hide();
            }
        }
    }
    _createButton(ButtonClass) {
        const editor = this.editor;
        const buttonView = new ButtonClass(editor.locale);
        buttonView.set({
            withText: true
        });
        buttonView.bind('isOn').to(this, 'isSourceEditingMode');
        // The button should be disabled if one of the following conditions is met:
        buttonView.bind('isEnabled').to(this, 'isEnabled', editor, 'isReadOnly', editor.plugins.get(PendingActions), 'hasAny', (isEnabled, isEditorReadOnly, hasAnyPendingActions)=>{
            // (1) The plugin itself is disabled.
            if (!isEnabled) {
                return false;
            }
            // (2) The editor is in read-only mode.
            if (isEditorReadOnly) {
                return false;
            }
            // (3) Any pending action is scheduled. It may change the model, so modifying the document source should be prevented
            // until the model is finally set.
            if (hasAnyPendingActions) {
                return false;
            }
            return true;
        });
        this.listenTo(buttonView, 'execute', ()=>{
            this.isSourceEditingMode = !this.isSourceEditingMode;
        });
        return buttonView;
    }
}
/**
 * Formats the content for a better readability.
 *
 * For a non-HTML source the unchanged input string is returned.
 *
 * @param input Input string to check.
 */ function formatSource(input) {
    if (!isHtml(input)) {
        return input;
    }
    return formatHtml(input);
}
/**
 * Checks, if the document source is HTML. It is sufficient to just check the first character from the document data.
 *
 * @param input Input string to check.
 */ function isHtml(input) {
    return input.startsWith('<');
}

export { SourceEditing };
//# sourceMappingURL=index.js.map
