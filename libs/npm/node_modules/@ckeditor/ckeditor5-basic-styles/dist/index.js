/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin, icons } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { TwoStepCaretMovement, inlineHighlight } from '@ckeditor/ckeditor5-typing/dist/index.js';

/**
 * An extension of the base {@link module:core/command~Command} class, which provides utilities for a command
 * that toggles a single attribute on a text or an element.
 *
 * `AttributeCommand` uses {@link module:engine/model/document~Document#selection}
 * to decide which nodes (if any) should be changed, and applies or removes the attribute from them.
 *
 * The command checks the {@link module:engine/model/model~Model#schema} to decide if it can be enabled
 * for the current selection and to which nodes the attribute can be applied.
 */ class AttributeCommand extends Command {
    /**
	 * The attribute that will be set by the command.
	 */ attributeKey;
    /**
	 * @param attributeKey Attribute that will be set by the command.
	 */ constructor(editor, attributeKey){
        super(editor);
        this.attributeKey = attributeKey;
    }
    /**
	 * Updates the command's {@link #value} and {@link #isEnabled} based on the current selection.
	 */ refresh() {
        const model = this.editor.model;
        const doc = model.document;
        this.value = this._getValueFromFirstAllowedNode();
        this.isEnabled = model.schema.checkAttributeInSelection(doc.selection, this.attributeKey);
    }
    /**
	 * Executes the command &ndash; applies the attribute to the selection or removes it from the selection.
	 *
	 * If the command is active (`value == true`), it will remove attributes. Otherwise, it will set attributes.
	 *
	 * The execution result differs, depending on the {@link module:engine/model/document~Document#selection}:
	 *
	 * * If the selection is on a range, the command applies the attribute to all nodes in that range
	 * (if they are allowed to have this attribute by the {@link module:engine/model/schema~Schema schema}).
	 * * If the selection is collapsed in a non-empty node, the command applies the attribute to the
	 * {@link module:engine/model/document~Document#selection} itself (note that typed characters copy attributes from the selection).
	 * * If the selection is collapsed in an empty node, the command applies the attribute to the parent node of the selection (note
	 * that the selection inherits all attributes from a node if it is in an empty node).
	 *
	 * @fires execute
	 * @param options Command options.
	 * @param options.forceValue If set, it will force the command behavior. If `true`,
	 * the command will apply the attribute, otherwise the command will remove the attribute.
	 * If not set, the command will look for its current value to decide what it should do.
	 */ execute(options = {}) {
        const model = this.editor.model;
        const doc = model.document;
        const selection = doc.selection;
        const value = options.forceValue === undefined ? !this.value : options.forceValue;
        model.change((writer)=>{
            if (selection.isCollapsed) {
                if (value) {
                    writer.setSelectionAttribute(this.attributeKey, true);
                } else {
                    writer.removeSelectionAttribute(this.attributeKey);
                }
            } else {
                const ranges = model.schema.getValidRanges(selection.getRanges(), this.attributeKey);
                for (const range of ranges){
                    if (value) {
                        writer.setAttribute(this.attributeKey, value, range);
                    } else {
                        writer.removeAttribute(this.attributeKey, range);
                    }
                }
            }
        });
    }
    /**
	 * Checks the attribute value of the first node in the selection that allows the attribute.
	 * For the collapsed selection returns the selection attribute.
	 *
	 * @returns The attribute value.
	 */ _getValueFromFirstAllowedNode() {
        const model = this.editor.model;
        const schema = model.schema;
        const selection = model.document.selection;
        if (selection.isCollapsed) {
            return selection.hasAttribute(this.attributeKey);
        }
        for (const range of selection.getRanges()){
            for (const item of range.getItems()){
                if (schema.checkAttribute(item, this.attributeKey)) {
                    return item.hasAttribute(this.attributeKey);
                }
            }
        }
        return false;
    }
}

const BOLD$1 = 'bold';
/**
 * The bold editing feature.
 *
 * It registers the `'bold'` command and introduces the `bold` attribute in the model which renders to the view
 * as a `<strong>` element.
 */ class BoldEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'BoldEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        // Allow bold attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: BOLD$1
        });
        editor.model.schema.setAttributeProperties(BOLD$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        // Build converter from model to view for data and editing pipelines.
        editor.conversion.attributeToElement({
            model: BOLD$1,
            view: 'strong',
            upcastAlso: [
                'b',
                (viewElement)=>{
                    const fontWeight = viewElement.getStyle('font-weight');
                    if (!fontWeight) {
                        return null;
                    }
                    // Value of the `font-weight` attribute can be defined as a string or a number.
                    if (fontWeight == 'bold' || Number(fontWeight) >= 600) {
                        return {
                            name: true,
                            styles: [
                                'font-weight'
                            ]
                        };
                    }
                    return null;
                }
            ]
        });
        // Create bold command.
        editor.commands.add(BOLD$1, new AttributeCommand(editor, BOLD$1));
        // Set the Ctrl+B keystroke.
        editor.keystrokes.set('CTRL+B', BOLD$1);
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Bold text'),
                    keystroke: 'CTRL+B'
                }
            ]
        });
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module basic-styles/utils
 */ /**
 * Returns a function that creates a (toolbar or menu bar) button for a basic style feature.
 */ function getButtonCreator({ editor, commandName, plugin, icon, label, keystroke }) {
    return (ButtonClass)=>{
        const command = editor.commands.get(commandName);
        const view = new ButtonClass(editor.locale);
        view.set({
            label,
            icon,
            keystroke,
            isToggleable: true
        });
        view.bind('isEnabled').to(command, 'isEnabled');
        // Execute the command.
        plugin.listenTo(view, 'execute', ()=>{
            editor.execute(commandName);
            editor.editing.view.focus();
        });
        return view;
    };
}

const BOLD = 'bold';
/**
 * The bold UI feature. It introduces the Bold button.
 */ class BoldUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'BoldUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        const command = editor.commands.get(BOLD);
        const createButton = getButtonCreator({
            editor,
            commandName: BOLD,
            plugin: this,
            icon: icons.bold,
            label: t('Bold'),
            keystroke: 'CTRL+B'
        });
        // Add bold button to feature components.
        editor.ui.componentFactory.add(BOLD, ()=>{
            const buttonView = createButton(ButtonView);
            buttonView.set({
                tooltip: true
            });
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + BOLD, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The bold feature.
 *
 * For a detailed overview check the {@glink features/basic-styles Basic styles feature} guide
 * and the {@glink api/basic-styles package page}.
 *
 * This is a "glue" plugin which loads the {@link module:basic-styles/bold/boldediting~BoldEditing bold editing feature}
 * and {@link module:basic-styles/bold/boldui~BoldUI bold UI feature}.
 */ class Bold extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            BoldEditing,
            BoldUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Bold';
    }
}

const CODE$1 = 'code';
const HIGHLIGHT_CLASS = 'ck-code_selected';
/**
 * The code editing feature.
 *
 * It registers the `'code'` command and introduces the `code` attribute in the model which renders to the view
 * as a `<code>` element.
 */ class CodeEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'CodeEditing';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            TwoStepCaretMovement
        ];
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        // Allow code attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: CODE$1
        });
        editor.model.schema.setAttributeProperties(CODE$1, {
            isFormatting: true,
            copyOnEnter: false
        });
        editor.conversion.attributeToElement({
            model: CODE$1,
            view: 'code',
            upcastAlso: {
                styles: {
                    'word-wrap': 'break-word'
                }
            }
        });
        // Create code command.
        editor.commands.add(CODE$1, new AttributeCommand(editor, CODE$1));
        // Enable two-step caret movement for `code` attribute.
        editor.plugins.get(TwoStepCaretMovement).registerAttribute(CODE$1);
        // Setup highlight over selected element.
        inlineHighlight(editor, CODE$1, 'code', HIGHLIGHT_CLASS);
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Move out of an inline code style'),
                    keystroke: [
                        [
                            'arrowleft',
                            'arrowleft'
                        ],
                        [
                            'arrowright',
                            'arrowright'
                        ]
                    ]
                }
            ]
        });
    }
}

var codeIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m12.5 5.7 5.2 3.9v1.3l-5.6 4c-.1.2-.3.2-.5.2-.3-.1-.6-.7-.6-1l.3-.4 4.7-3.5L11.5 7l-.2-.2c-.1-.3-.1-.6 0-.8.2-.2.5-.4.8-.4a.8.8 0 0 1 .4.1zm-5.2 0L2 9.6v1.3l5.6 4c.1.2.3.2.5.2.3-.1.7-.7.6-1 0-.1 0-.3-.2-.4l-5-3.5L8.2 7l.2-.2c.1-.3.1-.6 0-.8-.2-.2-.5-.4-.8-.4a.8.8 0 0 0-.3.1z\"/></svg>";

const CODE = 'code';
/**
 * The code UI feature. It introduces the Code button.
 */ class CodeUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'CodeUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: CODE,
            plugin: this,
            icon: codeIcon,
            label: t('Code')
        });
        // Add code button to feature components.
        editor.ui.componentFactory.add(CODE, ()=>{
            const buttonView = createButton(ButtonView);
            const command = editor.commands.get(CODE);
            buttonView.set({
                tooltip: true
            });
            // Bind button model to command.
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + CODE, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The code feature.
 *
 * For a detailed overview check the {@glink features/basic-styles Basic styles feature} guide
 * and the {@glink api/basic-styles package page}.
 *
 * This is a "glue" plugin which loads the {@link module:basic-styles/code/codeediting~CodeEditing code editing feature}
 * and {@link module:basic-styles/code/codeui~CodeUI code UI feature}.
 */ class Code extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            CodeEditing,
            CodeUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Code';
    }
}

const ITALIC$1 = 'italic';
/**
 * The italic editing feature.
 *
 * It registers the `'italic'` command, the <kbd>Ctrl+I</kbd> keystroke and introduces the `italic` attribute in the model
 * which renders to the view as an `<i>` element.
 */ class ItalicEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ItalicEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        // Allow italic attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: ITALIC$1
        });
        editor.model.schema.setAttributeProperties(ITALIC$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        editor.conversion.attributeToElement({
            model: ITALIC$1,
            view: 'i',
            upcastAlso: [
                'em',
                {
                    styles: {
                        'font-style': 'italic'
                    }
                }
            ]
        });
        // Create italic command.
        editor.commands.add(ITALIC$1, new AttributeCommand(editor, ITALIC$1));
        // Set the Ctrl+I keystroke.
        editor.keystrokes.set('CTRL+I', ITALIC$1);
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Italic text'),
                    keystroke: 'CTRL+I'
                }
            ]
        });
    }
}

var italicIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9.586 14.633.021.004c-.036.335.095.655.393.962.082.083.173.15.274.201h1.474a.6.6 0 1 1 0 1.2H5.304a.6.6 0 0 1 0-1.2h1.15c.474-.07.809-.182 1.005-.334.157-.122.291-.32.404-.597l2.416-9.55a1.053 1.053 0 0 0-.281-.823 1.12 1.12 0 0 0-.442-.296H8.15a.6.6 0 0 1 0-1.2h6.443a.6.6 0 1 1 0 1.2h-1.195c-.376.056-.65.155-.823.296-.215.175-.423.439-.623.79l-2.366 9.347z\"/></svg>";

const ITALIC = 'italic';
/**
 * The italic UI feature. It introduces the Italic button.
 */ class ItalicUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ItalicUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const command = editor.commands.get(ITALIC);
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: ITALIC,
            plugin: this,
            icon: italicIcon,
            keystroke: 'CTRL+I',
            label: t('Italic')
        });
        // Add bold button to feature components.
        editor.ui.componentFactory.add(ITALIC, ()=>{
            const buttonView = createButton(ButtonView);
            buttonView.set({
                tooltip: true
            });
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + ITALIC, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The italic feature.
 *
 * For a detailed overview check the {@glink features/basic-styles Basic styles feature} guide
 * and the {@glink api/basic-styles package page}.
 *
 * This is a "glue" plugin which loads the {@link module:basic-styles/italic/italicediting~ItalicEditing} and
 * {@link module:basic-styles/italic/italicui~ItalicUI} plugins.
 */ class Italic extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ItalicEditing,
            ItalicUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Italic';
    }
}

const STRIKETHROUGH$1 = 'strikethrough';
/**
 * The strikethrough editing feature.
 *
 * It registers the `'strikethrough'` command, the <kbd>Ctrl+Shift+X</kbd> keystroke and introduces the
 * `strikethroughsthrough` attribute in the model which renders to the view
 * as a `<s>` element.
 */ class StrikethroughEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'StrikethroughEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        // Allow strikethrough attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: STRIKETHROUGH$1
        });
        editor.model.schema.setAttributeProperties(STRIKETHROUGH$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        editor.conversion.attributeToElement({
            model: STRIKETHROUGH$1,
            view: 's',
            upcastAlso: [
                'del',
                'strike',
                {
                    styles: {
                        'text-decoration': 'line-through'
                    }
                }
            ]
        });
        // Create strikethrough command.
        editor.commands.add(STRIKETHROUGH$1, new AttributeCommand(editor, STRIKETHROUGH$1));
        // Set the Ctrl+Shift+X keystroke.
        editor.keystrokes.set('CTRL+SHIFT+X', 'strikethrough');
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Strikethrough text'),
                    keystroke: 'CTRL+SHIFT+X'
                }
            ]
        });
    }
}

var strikethroughIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 16.4c-.8-.4-1.5-.9-2.2-1.5a.6.6 0 0 1-.2-.5l.3-.6h1c1 1.2 2.1 1.7 3.7 1.7 1 0 1.8-.3 2.3-.6.6-.4.6-1.2.6-1.3.2-1.2-.9-2.1-.9-2.1h2.1c.3.7.4 1.2.4 1.7v.8l-.6 1.2c-.6.8-1.1 1-1.6 1.2a6 6 0 0 1-2.4.6c-1 0-1.8-.3-2.5-.6zM6.8 9 6 8.3c-.4-.5-.5-.8-.5-1.6 0-.7.1-1.3.5-1.8.4-.6 1-1 1.6-1.3a6.3 6.3 0 0 1 4.7 0 4 4 0 0 1 1.7 1l.3.7c0 .1.2.4-.2.7-.4.2-.9.1-1 0a3 3 0 0 0-1.2-1c-.4-.2-1-.3-2-.4-.7 0-1.4.2-2 .6-.8.6-1 .8-1 1.5 0 .8.5 1 1.2 1.5.6.4 1.1.7 1.9 1H6.8z\"/><path d=\"M3 10.5V9h14v1.5z\"/></svg>";

const STRIKETHROUGH = 'strikethrough';
/**
 * The strikethrough UI feature. It introduces the Strikethrough button.
 */ class StrikethroughUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'StrikethroughUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: STRIKETHROUGH,
            plugin: this,
            icon: strikethroughIcon,
            keystroke: 'CTRL+SHIFT+X',
            label: t('Strikethrough')
        });
        // Add strikethrough button to feature components.
        editor.ui.componentFactory.add(STRIKETHROUGH, ()=>{
            const buttonView = createButton(ButtonView);
            const command = editor.commands.get(STRIKETHROUGH);
            buttonView.set({
                tooltip: true
            });
            // Bind button model to command.
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + STRIKETHROUGH, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The strikethrough feature.
 *
 * For a detailed overview check the {@glink features/basic-styles Basic styles feature} guide
 * and the {@glink api/basic-styles package page}.
 *
 * This is a "glue" plugin which loads the {@link module:basic-styles/strikethrough/strikethroughediting~StrikethroughEditing} and
 * {@link module:basic-styles/strikethrough/strikethroughui~StrikethroughUI} plugins.
 */ class Strikethrough extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            StrikethroughEditing,
            StrikethroughUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Strikethrough';
    }
}

const SUBSCRIPT$1 = 'subscript';
/**
 * The subscript editing feature.
 *
 * It registers the `sub` command and introduces the `sub` attribute in the model which renders to the view
 * as a `<sub>` element.
 */ class SubscriptEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SubscriptEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        // Allow sub attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: SUBSCRIPT$1
        });
        editor.model.schema.setAttributeProperties(SUBSCRIPT$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        // Build converter from model to view for data and editing pipelines.
        editor.conversion.attributeToElement({
            model: SUBSCRIPT$1,
            view: 'sub',
            upcastAlso: [
                {
                    styles: {
                        'vertical-align': 'sub'
                    }
                }
            ]
        });
        // Create sub command.
        editor.commands.add(SUBSCRIPT$1, new AttributeCommand(editor, SUBSCRIPT$1));
    }
}

var subscriptIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m7.03 10.349 3.818-3.819a.8.8 0 1 1 1.132 1.132L8.16 11.48l3.819 3.818a.8.8 0 1 1-1.132 1.132L7.03 12.61l-3.818 3.82a.8.8 0 1 1-1.132-1.132L5.9 11.48 2.08 7.662A.8.8 0 1 1 3.212 6.53l3.818 3.82zm8.147 7.829h2.549c.254 0 .447.05.58.152a.49.49 0 0 1 .201.413.54.54 0 0 1-.159.393c-.105.108-.266.162-.48.162h-3.594c-.245 0-.435-.066-.572-.197a.621.621 0 0 1-.205-.463c0-.114.044-.265.132-.453a1.62 1.62 0 0 1 .288-.444c.433-.436.824-.81 1.172-1.122.348-.312.597-.517.747-.615.267-.183.49-.368.667-.553.177-.185.312-.375.405-.57.093-.194.139-.384.139-.57a1.008 1.008 0 0 0-.554-.917 1.197 1.197 0 0 0-.56-.133c-.426 0-.761.182-1.005.546a2.332 2.332 0 0 0-.164.39 1.609 1.609 0 0 1-.258.488c-.096.114-.237.17-.423.17a.558.558 0 0 1-.405-.156.568.568 0 0 1-.161-.427c0-.218.05-.446.151-.683.101-.238.252-.453.452-.646s.454-.349.762-.467a2.998 2.998 0 0 1 1.081-.178c.498 0 .923.076 1.274.228a1.916 1.916 0 0 1 1.004 1.032 1.984 1.984 0 0 1-.156 1.794c-.2.32-.405.572-.613.754-.208.182-.558.468-1.048.857-.49.39-.826.691-1.008.906a2.703 2.703 0 0 0-.24.309z\"/></svg>";

const SUBSCRIPT = 'subscript';
/**
 * The subscript UI feature. It introduces the Subscript button.
 */ class SubscriptUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SubscriptUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: SUBSCRIPT,
            plugin: this,
            icon: subscriptIcon,
            label: t('Subscript')
        });
        // Add subscript button to feature components.
        editor.ui.componentFactory.add(SUBSCRIPT, ()=>{
            const buttonView = createButton(ButtonView);
            const command = editor.commands.get(SUBSCRIPT);
            buttonView.set({
                tooltip: true
            });
            // Bind button model to command.
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + SUBSCRIPT, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The subscript feature.
 *
 * It loads the {@link module:basic-styles/subscript/subscriptediting~SubscriptEditing} and
 * {@link module:basic-styles/subscript/subscriptui~SubscriptUI} plugins.
 */ class Subscript extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            SubscriptEditing,
            SubscriptUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Subscript';
    }
}

const SUPERSCRIPT$1 = 'superscript';
/**
 * The superscript editing feature.
 *
 * It registers the `super` command and introduces the `super` attribute in the model which renders to the view
 * as a `<super>` element.
 */ class SuperscriptEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SuperscriptEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        // Allow super attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: SUPERSCRIPT$1
        });
        editor.model.schema.setAttributeProperties(SUPERSCRIPT$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        // Build converter from model to view for data and editing pipelines.
        editor.conversion.attributeToElement({
            model: SUPERSCRIPT$1,
            view: 'sup',
            upcastAlso: [
                {
                    styles: {
                        'vertical-align': 'super'
                    }
                }
            ]
        });
        // Create super command.
        editor.commands.add(SUPERSCRIPT$1, new AttributeCommand(editor, SUPERSCRIPT$1));
    }
}

var superscriptIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15.677 8.678h2.549c.254 0 .447.05.58.152a.49.49 0 0 1 .201.413.54.54 0 0 1-.159.393c-.105.108-.266.162-.48.162h-3.594c-.245 0-.435-.066-.572-.197a.621.621 0 0 1-.205-.463c0-.114.044-.265.132-.453a1.62 1.62 0 0 1 .288-.444c.433-.436.824-.81 1.172-1.122.348-.312.597-.517.747-.615.267-.183.49-.368.667-.553.177-.185.312-.375.405-.57.093-.194.139-.384.139-.57a1.008 1.008 0 0 0-.554-.917 1.197 1.197 0 0 0-.56-.133c-.426 0-.761.182-1.005.546a2.332 2.332 0 0 0-.164.39 1.609 1.609 0 0 1-.258.488c-.096.114-.237.17-.423.17a.558.558 0 0 1-.405-.156.568.568 0 0 1-.161-.427c0-.218.05-.446.151-.683.101-.238.252-.453.452-.646s.454-.349.762-.467a2.998 2.998 0 0 1 1.081-.178c.498 0 .923.076 1.274.228a1.916 1.916 0 0 1 1.004 1.032 1.984 1.984 0 0 1-.156 1.794c-.2.32-.405.572-.613.754-.208.182-.558.468-1.048.857-.49.39-.826.691-1.008.906a2.703 2.703 0 0 0-.24.309zM7.03 10.349l3.818-3.819a.8.8 0 1 1 1.132 1.132L8.16 11.48l3.819 3.818a.8.8 0 1 1-1.132 1.132L7.03 12.61l-3.818 3.82a.8.8 0 1 1-1.132-1.132L5.9 11.48 2.08 7.662A.8.8 0 1 1 3.212 6.53l3.818 3.82z\"/></svg>";

const SUPERSCRIPT = 'superscript';
/**
 * The superscript UI feature. It introduces the Superscript button.
 */ class SuperscriptUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SuperscriptUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: SUPERSCRIPT,
            plugin: this,
            icon: superscriptIcon,
            label: t('Superscript')
        });
        // Add superscript button to feature components.
        editor.ui.componentFactory.add(SUPERSCRIPT, ()=>{
            const buttonView = createButton(ButtonView);
            const command = editor.commands.get(SUPERSCRIPT);
            buttonView.set({
                tooltip: true
            });
            // Bind button model to command.
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + SUPERSCRIPT, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The superscript feature.
 *
 * It loads the {@link module:basic-styles/superscript/superscriptediting~SuperscriptEditing} and
 * {@link module:basic-styles/superscript/superscriptui~SuperscriptUI} plugins.
 */ class Superscript extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            SuperscriptEditing,
            SuperscriptUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Superscript';
    }
}

const UNDERLINE$1 = 'underline';
/**
 * The underline editing feature.
 *
 * It registers the `'underline'` command, the <kbd>Ctrl+U</kbd> keystroke
 * and introduces the `underline` attribute in the model which renders to the view as an `<u>` element.
 */ class UnderlineEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'UnderlineEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        // Allow strikethrough attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: UNDERLINE$1
        });
        editor.model.schema.setAttributeProperties(UNDERLINE$1, {
            isFormatting: true,
            copyOnEnter: true
        });
        editor.conversion.attributeToElement({
            model: UNDERLINE$1,
            view: 'u',
            upcastAlso: {
                styles: {
                    'text-decoration': 'underline'
                }
            }
        });
        // Create underline command.
        editor.commands.add(UNDERLINE$1, new AttributeCommand(editor, UNDERLINE$1));
        // Set the Ctrl+U keystroke.
        editor.keystrokes.set('CTRL+U', 'underline');
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Underline text'),
                    keystroke: 'CTRL+U'
                }
            ]
        });
    }
}

var underlineIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 18v-1.5h14V18zm2.2-8V3.6c0-.4.4-.6.8-.6.3 0 .7.2.7.6v6.2c0 2 1.3 2.8 3.2 2.8 1.9 0 3.4-.9 3.4-2.9V3.6c0-.3.4-.5.8-.5.3 0 .7.2.7.5V10c0 2.7-2.2 4-4.9 4-2.6 0-4.7-1.2-4.7-4z\"/></svg>";

const UNDERLINE = 'underline';
/**
 * The underline UI feature. It introduces the Underline button.
 */ class UnderlineUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'UnderlineUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const command = editor.commands.get(UNDERLINE);
        const t = editor.locale.t;
        const createButton = getButtonCreator({
            editor,
            commandName: UNDERLINE,
            plugin: this,
            icon: underlineIcon,
            label: t('Underline'),
            keystroke: 'CTRL+U'
        });
        // Add bold button to feature components.
        editor.ui.componentFactory.add(UNDERLINE, ()=>{
            const buttonView = createButton(ButtonView);
            buttonView.set({
                tooltip: true
            });
            buttonView.bind('isOn').to(command, 'value');
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + UNDERLINE, ()=>{
            return createButton(MenuBarMenuListItemButtonView);
        });
    }
}

/**
 * The underline feature.
 *
 * For a detailed overview check the {@glink features/basic-styles Basic styles feature} guide
 * and the {@glink api/basic-styles package page}.
 *
 * This is a "glue" plugin which loads the {@link module:basic-styles/underline/underlineediting~UnderlineEditing} and
 * {@link module:basic-styles/underline/underlineui~UnderlineUI} plugins.
 */ class Underline extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            UnderlineEditing,
            UnderlineUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Underline';
    }
}

export { Bold, BoldEditing, BoldUI, Code, CodeEditing, CodeUI, Italic, ItalicEditing, ItalicUI, Strikethrough, StrikethroughEditing, StrikethroughUI, Subscript, SubscriptEditing, SubscriptUI, Superscript, SuperscriptEditing, SuperscriptUI, Underline, UnderlineEditing, UnderlineUI };
//# sourceMappingURL=index.js.map
