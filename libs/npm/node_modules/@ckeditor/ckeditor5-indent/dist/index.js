/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin, MultiCommand, icons, Command } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { addMarginRules } from '@ckeditor/ckeditor5-engine/dist/index.js';
import { first } from '@ckeditor/ckeditor5-utils/dist/index.js';

/**
 * The indent editing feature.
 *
 * This plugin registers the `'indent'` and `'outdent'` commands.
 *
 * **Note**: In order for the commands to work, at least one of the compatible features is required. Read more in the
 * {@link module:indent/indent~Indent indent feature} API documentation.
 */ class IndentEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'IndentEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.commands.add('indent', new MultiCommand(editor));
        editor.commands.add('outdent', new MultiCommand(editor));
    }
}

/**
 * The indent UI feature.
 *
 * This plugin registers the `'indent'` and `'outdent'` buttons.
 *
 * **Note**: In order for the commands to work, at least one of the compatible features is required. Read more in
 * the {@link module:indent/indent~Indent indent feature} API documentation.
 */ class IndentUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'IndentUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const locale = editor.locale;
        const t = editor.t;
        const localizedIndentIcon = locale.uiLanguageDirection == 'ltr' ? icons.indent : icons.outdent;
        const localizedOutdentIcon = locale.uiLanguageDirection == 'ltr' ? icons.outdent : icons.indent;
        this._defineButton('indent', t('Increase indent'), localizedIndentIcon);
        this._defineButton('outdent', t('Decrease indent'), localizedOutdentIcon);
    }
    /**
	 * Defines UI buttons for both toolbar and menu bar.
	 */ _defineButton(commandName, label, icon) {
        const editor = this.editor;
        editor.ui.componentFactory.add(commandName, ()=>{
            const buttonView = this._createButton(ButtonView, commandName, label, icon);
            buttonView.set({
                tooltip: true
            });
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:' + commandName, ()=>{
            return this._createButton(MenuBarMenuListItemButtonView, commandName, label, icon);
        });
    }
    /**
	 * Creates a button to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass, commandName, label, icon) {
        const editor = this.editor;
        const command = editor.commands.get(commandName);
        const view = new ButtonClass(editor.locale);
        view.set({
            label,
            icon
        });
        view.bind('isEnabled').to(command, 'isEnabled');
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute(commandName);
            editor.editing.view.focus();
        });
        return view;
    }
}

/**
 * The indent feature.
 *
 * This plugin acts as a single entry point plugin for other features that implement indentation of elements like lists or paragraphs.
 *
 * The compatible features are:
 *
 * * The {@link module:list/list~List} or {@link module:list/list/listediting~ListEditing} feature for list indentation.
 * * The {@link module:indent/indentblock~IndentBlock} feature for block indentation.
 *
 * This is a "glue" plugin that loads the following plugins:
 *
 * * The {@link module:indent/indentediting~IndentEditing indent editing feature}.
 * * The {@link module:indent/indentui~IndentUI indent UI feature}.
 *
 * The dependent plugins register the `'indent'` and `'outdent'` commands and introduce the `'indent'` and `'outdent'` buttons
 * that allow to increase or decrease text indentation of supported elements.
 *
 * **Note**: In order for the commands and buttons to work, at least one of compatible features is required.
 */ class Indent extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Indent';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            IndentEditing,
            IndentUI
        ];
    }
}

/**
 * The indent block command.
 *
 * The command is registered by the {@link module:indent/indentblock~IndentBlock} as `'indentBlock'` for indenting blocks and
 * `'outdentBlock'` for outdenting blocks.
 *
 * To increase block indentation at the current selection, execute the command:
 *
 * ```ts
 * editor.execute( 'indentBlock' );
 * ```
 *
 * To decrease block indentation at the current selection, execute the command:
 *
 * ```ts
 * editor.execute( 'outdentBlock' );
 * ```
 */ class IndentBlockCommand extends Command {
    /**
	 * The command's indentation behavior.
	 */ _indentBehavior;
    /**
	 * Creates an instance of the command.
	 */ constructor(editor, indentBehavior){
        super(editor);
        this._indentBehavior = indentBehavior;
    }
    /**
	 * @inheritDoc
	 */ refresh() {
        const editor = this.editor;
        const model = editor.model;
        const block = first(model.document.selection.getSelectedBlocks());
        if (!block || !this._isIndentationChangeAllowed(block)) {
            this.isEnabled = false;
            return;
        }
        this.isEnabled = this._indentBehavior.checkEnabled(block.getAttribute('blockIndent'));
    }
    /**
	 * @inheritDoc
	 */ execute() {
        const model = this.editor.model;
        const blocksToChange = this._getBlocksToChange();
        model.change((writer)=>{
            for (const block of blocksToChange){
                const currentIndent = block.getAttribute('blockIndent');
                const nextIndent = this._indentBehavior.getNextIndent(currentIndent);
                if (nextIndent) {
                    writer.setAttribute('blockIndent', nextIndent, block);
                } else {
                    writer.removeAttribute('blockIndent', block);
                }
            }
        });
    }
    /**
	 * Returns blocks from selection that should have blockIndent selection set.
	 */ _getBlocksToChange() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const blocksInSelection = Array.from(selection.getSelectedBlocks());
        return blocksInSelection.filter((block)=>this._isIndentationChangeAllowed(block));
    }
    /**
	 * Returns false if indentation cannot be applied, i.e.:
	 * - for blocks disallowed by schema declaration
	 * - for blocks in Document Lists (disallowed forward indentation only). See https://github.com/ckeditor/ckeditor5/issues/14155.
	 * Otherwise returns true.
	 */ _isIndentationChangeAllowed(element) {
        const editor = this.editor;
        if (!editor.model.schema.checkAttribute(element, 'blockIndent')) {
            return false;
        }
        if (!editor.plugins.has('ListUtils')) {
            return true;
        }
        // Only forward indentation is disallowed in list items. This allows the user to outdent blocks that are already indented.
        if (!this._indentBehavior.isForward) {
            return true;
        }
        const documentListUtils = editor.plugins.get('ListUtils');
        return !documentListUtils.isListItemBlock(element);
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module indent/indentcommandbehavior/indentusingoffset
 */ /**
 * The block indentation behavior that uses offsets to set indentation.
 */ class IndentUsingOffset {
    /**
	 * The direction of indentation.
	 */ isForward;
    /**
	 * The offset of the next indentation step.
	 */ offset;
    /**
	 * Indentation unit.
	 */ unit;
    /**
	 * Creates an instance of the indentation behavior.
	 *
	 * @param config.direction The direction of indentation.
	 * @param config.offset The offset of the next indentation step.
	 * @param config.unit Indentation unit.
	 */ constructor(config){
        this.isForward = config.direction === 'forward';
        this.offset = config.offset;
        this.unit = config.unit;
    }
    /**
	 * @inheritDoc
	 */ checkEnabled(indentAttributeValue) {
        const currentOffset = parseFloat(indentAttributeValue || '0');
        // The command is always enabled for forward indentation.
        return this.isForward || currentOffset > 0;
    }
    /**
	 * @inheritDoc
	 */ getNextIndent(indentAttributeValue) {
        const currentOffset = parseFloat(indentAttributeValue || '0');
        const isSameUnit = !indentAttributeValue || indentAttributeValue.endsWith(this.unit);
        if (!isSameUnit) {
            return this.isForward ? this.offset + this.unit : undefined;
        }
        const nextOffset = this.isForward ? this.offset : -this.offset;
        const offsetToSet = currentOffset + nextOffset;
        return offsetToSet > 0 ? offsetToSet + this.unit : undefined;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module indent/indentcommandbehavior/indentusingclasses
 */ /**
 * The block indentation behavior that uses classes to set indentation.
 */ class IndentUsingClasses {
    /**
	 * The direction of indentation.
	 */ isForward;
    /**
	 * A list of classes used for indentation.
	 */ classes;
    /**
	 * Creates an instance of the indentation behavior.
	 *
	 * @param config.direction The direction of indentation.
	 * @param config.classes A list of classes used for indentation.
	 */ constructor(config){
        this.isForward = config.direction === 'forward';
        this.classes = config.classes;
    }
    /**
	 * @inheritDoc
	 */ checkEnabled(indentAttributeValue) {
        const currentIndex = this.classes.indexOf(indentAttributeValue);
        if (this.isForward) {
            return currentIndex < this.classes.length - 1;
        } else {
            return currentIndex >= 0;
        }
    }
    /**
	 * @inheritDoc
	 */ getNextIndent(indentAttributeValue) {
        const currentIndex = this.classes.indexOf(indentAttributeValue);
        const indexStep = this.isForward ? 1 : -1;
        return this.classes[currentIndex + indexStep];
    }
}

const DEFAULT_ELEMENTS = [
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6'
];
/**
 * The block indentation feature.
 *
 * It registers the `'indentBlock'` and `'outdentBlock'` commands.
 *
 * If the plugin {@link module:indent/indent~Indent} is defined, it also attaches the `'indentBlock'` and `'outdentBlock'` commands to
 * the `'indent'` and `'outdent'` commands.
 */ class IndentBlock extends Plugin {
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        editor.config.define('indentBlock', {
            offset: 40,
            unit: 'px'
        });
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'IndentBlock';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const configuration = editor.config.get('indentBlock');
        if (configuration.classes && configuration.classes.length) {
            this._setupConversionUsingClasses(configuration.classes);
            editor.commands.add('indentBlock', new IndentBlockCommand(editor, new IndentUsingClasses({
                direction: 'forward',
                classes: configuration.classes
            })));
            editor.commands.add('outdentBlock', new IndentBlockCommand(editor, new IndentUsingClasses({
                direction: 'backward',
                classes: configuration.classes
            })));
        } else {
            editor.data.addStyleProcessorRules(addMarginRules);
            this._setupConversionUsingOffset();
            editor.commands.add('indentBlock', new IndentBlockCommand(editor, new IndentUsingOffset({
                direction: 'forward',
                offset: configuration.offset,
                unit: configuration.unit
            })));
            editor.commands.add('outdentBlock', new IndentBlockCommand(editor, new IndentUsingOffset({
                direction: 'backward',
                offset: configuration.offset,
                unit: configuration.unit
            })));
        }
    }
    /**
	 * @inheritDoc
	 */ afterInit() {
        const editor = this.editor;
        const schema = editor.model.schema;
        const indentCommand = editor.commands.get('indent');
        const outdentCommand = editor.commands.get('outdent');
        // Enable block indentation to heading configuration options. If it is not defined enable in paragraph and default headings.
        const options = editor.config.get('heading.options');
        const configuredElements = options && options.map((option)=>option.model);
        const knownElements = configuredElements || DEFAULT_ELEMENTS;
        knownElements.forEach((elementName)=>{
            if (schema.isRegistered(elementName)) {
                schema.extend(elementName, {
                    allowAttributes: 'blockIndent'
                });
            }
        });
        schema.setAttributeProperties('blockIndent', {
            isFormatting: true
        });
        indentCommand.registerChildCommand(editor.commands.get('indentBlock'));
        outdentCommand.registerChildCommand(editor.commands.get('outdentBlock'));
    }
    /**
	 * Setups conversion for using offset indents.
	 */ _setupConversionUsingOffset() {
        const conversion = this.editor.conversion;
        const locale = this.editor.locale;
        const marginProperty = locale.contentLanguageDirection === 'rtl' ? 'margin-right' : 'margin-left';
        conversion.for('upcast').attributeToAttribute({
            view: {
                styles: {
                    [marginProperty]: /[\s\S]+/
                }
            },
            model: {
                key: 'blockIndent',
                value: (viewElement)=>{
                    // Do not indent block elements in Document Lists. See https://github.com/ckeditor/ckeditor5/issues/12466.
                    if (!viewElement.is('element', 'li')) {
                        return viewElement.getStyle(marginProperty);
                    }
                }
            }
        });
        conversion.for('downcast').attributeToAttribute({
            model: 'blockIndent',
            view: (modelAttributeValue)=>{
                return {
                    key: 'style',
                    value: {
                        [marginProperty]: modelAttributeValue
                    }
                };
            }
        });
    }
    /**
	 * Setups conversion for using classes.
	 */ _setupConversionUsingClasses(classes) {
        const definition = {
            model: {
                key: 'blockIndent',
                values: []
            },
            view: {}
        };
        for (const className of classes){
            definition.model.values.push(className);
            definition.view[className] = {
                key: 'class',
                value: [
                    className
                ]
            };
        }
        this.editor.conversion.attributeToAttribute(definition);
    }
}

export { Indent, IndentBlock, IndentEditing, IndentUI };
//# sourceMappingURL=index.js.map
