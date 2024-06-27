/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin, Command } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { first } from '@ckeditor/ckeditor5-utils/dist/index.js';

var removeFormatIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8.69 14.915c.053.052.173.083.36.093a.366.366 0 0 1 .345.485l-.003.01a.738.738 0 0 1-.697.497h-2.67a.374.374 0 0 1-.353-.496l.013-.038a.681.681 0 0 1 .644-.458c.197-.012.325-.043.386-.093a.28.28 0 0 0 .072-.11L9.592 4.5H6.269c-.359-.017-.609.013-.75.09-.142.078-.289.265-.442.563-.192.29-.516.464-.864.464H4.17a.43.43 0 0 1-.407-.569L4.46 3h13.08l-.62 2.043a.81.81 0 0 1-.775.574h-.114a.486.486 0 0 1-.486-.486c.001-.284-.054-.464-.167-.54-.112-.076-.367-.106-.766-.091h-3.28l-2.68 10.257c-.006.074.007.127.038.158zM3 17h8a.5.5 0 1 1 0 1H3a.5.5 0 1 1 0-1zm11.299 1.17a.75.75 0 1 1-1.06-1.06l1.414-1.415-1.415-1.414a.75.75 0 0 1 1.06-1.06l1.415 1.414 1.414-1.415a.75.75 0 1 1 1.06 1.06l-1.413 1.415 1.414 1.415a.75.75 0 0 1-1.06 1.06l-1.415-1.414-1.414 1.414z\"/></svg>";

const REMOVE_FORMAT = 'removeFormat';
/**
 * The remove format UI plugin. It registers the `'removeFormat'` button which can be
 * used in the toolbar.
 */ class RemoveFormatUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RemoveFormatUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.ui.componentFactory.add(REMOVE_FORMAT, ()=>{
            const view = this._createButton(ButtonView);
            view.set({
                tooltip: true
            });
            return view;
        });
        editor.ui.componentFactory.add(`menuBar:${REMOVE_FORMAT}`, ()=>this._createButton(MenuBarMenuListItemButtonView));
    }
    /**
	 * Creates a button for remove format command to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = editor.commands.get(REMOVE_FORMAT);
        const view = new ButtonClass(editor.locale);
        const t = locale.t;
        view.set({
            label: t('Remove Format'),
            icon: removeFormatIcon
        });
        view.bind('isEnabled').to(command, 'isEnabled');
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute(REMOVE_FORMAT);
            editor.editing.view.focus();
        });
        return view;
    }
}

/**
 * The remove format command.
 *
 * It is used by the {@link module:remove-format/removeformat~RemoveFormat remove format feature}
 * to clear the formatting in the selection.
 *
 * ```ts
 * editor.execute( 'removeFormat' );
 * ```
 */ class RemoveFormatCommand extends Command {
    /**
	 * @inheritDoc
	 */ refresh() {
        const model = this.editor.model;
        this.isEnabled = !!first(this._getFormattingItems(model.document.selection, model.schema));
    }
    /**
	 * @inheritDoc
	 */ execute() {
        const model = this.editor.model;
        const schema = model.schema;
        model.change((writer)=>{
            for (const item of this._getFormattingItems(model.document.selection, schema)){
                if (item.is('selection')) {
                    for (const attributeName of this._getFormattingAttributes(item, schema)){
                        writer.removeSelectionAttribute(attributeName);
                    }
                } else {
                    // Workaround for items with multiple removable attributes. See
                    // https://github.com/ckeditor/ckeditor5-remove-format/pull/1#pullrequestreview-220515609
                    const itemRange = writer.createRangeOn(item);
                    for (const attributeName of this._getFormattingAttributes(item, schema)){
                        writer.removeAttribute(attributeName, itemRange);
                    }
                }
            }
        });
    }
    /**
	 * Returns an iterable of items in a selection (including the selection itself) that have formatting model
	 * attributes to be removed by the feature.
	 *
	 * @param schema The schema describing the item.
	 */ *_getFormattingItems(selection, schema) {
        const itemHasRemovableFormatting = (item)=>{
            return !!first(this._getFormattingAttributes(item, schema));
        };
        // Check formatting on selected items that are not blocks.
        for (const curRange of selection.getRanges()){
            for (const item of curRange.getItems()){
                if (!schema.isBlock(item) && itemHasRemovableFormatting(item)) {
                    yield item;
                }
            }
        }
        // Check formatting from selected blocks.
        for (const block of selection.getSelectedBlocks()){
            if (itemHasRemovableFormatting(block)) {
                yield block;
            }
        }
        // Finally the selection might be formatted as well, so make sure to check it.
        if (itemHasRemovableFormatting(selection)) {
            yield selection;
        }
    }
    /**
	 * Returns an iterable of formatting attributes of a given model item.
	 *
	 * **Note:** Formatting items have the `isFormatting` property set to `true`.
	 *
	 * @param schema The schema describing the item.
	 * @returns The names of formatting attributes found in a given item.
	 */ *_getFormattingAttributes(item, schema) {
        for (const [attributeName] of item.getAttributes()){
            const attributeProperties = schema.getAttributeProperties(attributeName);
            if (attributeProperties && attributeProperties.isFormatting) {
                yield attributeName;
            }
        }
    }
}

/**
 * The remove format editing plugin.
 *
 * It registers the {@link module:remove-format/removeformatcommand~RemoveFormatCommand removeFormat} command.
 */ class RemoveFormatEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RemoveFormatEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.commands.add('removeFormat', new RemoveFormatCommand(editor));
    }
}

/**
 * The remove format plugin.
 *
 * This is a "glue" plugin which loads the {@link module:remove-format/removeformatediting~RemoveFormatEditing}
 * and {@link module:remove-format/removeformatui~RemoveFormatUI} plugins.
 *
 * For a detailed overview, check out the {@glink features/remove-format remove format} feature documentation.
 */ class RemoveFormat extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            RemoveFormatEditing,
            RemoveFormatUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RemoveFormat';
    }
}

export { RemoveFormat, RemoveFormatEditing, RemoveFormatUI };
//# sourceMappingURL=index.js.map
