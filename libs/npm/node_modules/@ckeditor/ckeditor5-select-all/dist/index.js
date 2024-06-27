/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import { getCode, parseKeystroke } from '@ckeditor/ckeditor5-utils/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';

/**
 * The select all command.
 *
 * It is used by the {@link module:select-all/selectallediting~SelectAllEditing select all editing feature} to handle
 * the <kbd>Ctrl/⌘</kbd>+<kbd>A</kbd> keystroke.
 *
 * Executing this command changes the {@glink framework/architecture/editing-engine#model model}
 * selection so it contains the entire content of the editable root of the editor the selection is
 * {@link module:engine/model/selection~Selection#anchor anchored} in.
 *
 * If the selection was anchored in a {@glink framework/tutorials/widgets/implementing-a-block-widget nested editable}
 * (e.g. a caption of an image), the new selection will contain its entire content. Successive executions of this command
 * will expand the selection to encompass more and more content up to the entire editable root of the editor.
 */ class SelectAllCommand extends Command {
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        // It does not affect data so should be enabled in read-only mode.
        this.affectsData = false;
    }
    /**
	 * @inheritDoc
	 */ execute() {
        const model = this.editor.model;
        const selection = model.document.selection;
        let scopeElement = model.schema.getLimitElement(selection);
        // If an entire scope is selected, or the selection's ancestor is not a scope yet,
        // browse through ancestors to find the enclosing parent scope.
        if (selection.containsEntireContent(scopeElement) || !isSelectAllScope(model.schema, scopeElement)) {
            do {
                scopeElement = scopeElement.parent;
                // Do nothing, if the entire `root` is already selected.
                if (!scopeElement) {
                    return;
                }
            }while (!isSelectAllScope(model.schema, scopeElement))
        }
        model.change((writer)=>{
            writer.setSelection(scopeElement, 'in');
        });
    }
}
/**
 * Checks whether the element is a valid select-all scope. Returns true, if the element is a
 * {@link module:engine/model/schema~Schema#isLimit limit}, and can contain any text or paragraph.
 *
 * @param schema Schema to check against.
 * @param element Model element.
 */ function isSelectAllScope(schema, element) {
    return schema.isLimit(element) && (schema.checkChild(element, '$text') || schema.checkChild(element, 'paragraph'));
}

const SELECT_ALL_KEYSTROKE = /* #__PURE__ */ parseKeystroke('Ctrl+A');
/**
 * The select all editing feature.
 *
 * It registers the `'selectAll'` {@link module:select-all/selectallcommand~SelectAllCommand command}
 * and the <kbd>Ctrl/⌘</kbd>+<kbd>A</kbd> keystroke listener which executes it.
 */ class SelectAllEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SelectAllEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.t;
        const view = editor.editing.view;
        const viewDocument = view.document;
        editor.commands.add('selectAll', new SelectAllCommand(editor));
        this.listenTo(viewDocument, 'keydown', (eventInfo, domEventData)=>{
            if (getCode(domEventData) === SELECT_ALL_KEYSTROKE) {
                editor.execute('selectAll');
                domEventData.preventDefault();
            }
        });
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Select all'),
                    keystroke: 'CTRL+A'
                }
            ]
        });
    }
}

var selectAllIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path d=\"M.75 15.5a.75.75 0 0 1 .75.75V18l.008.09A.5.5 0 0 0 2 18.5h1.75a.75.75 0 1 1 0 1.5H1.5l-.144-.007a1.5 1.5 0 0 1-1.35-1.349L0 18.5v-2.25a.75.75 0 0 1 .75-.75zm18.5 0a.75.75 0 0 1 .75.75v2.25l-.007.144a1.5 1.5 0 0 1-1.349 1.35L18.5 20h-2.25a.75.75 0 1 1 0-1.5H18a.5.5 0 0 0 .492-.41L18.5 18v-1.75a.75.75 0 0 1 .75-.75zm-10.45 3c.11 0 .2.09.2.2v1.1a.2.2 0 0 1-.2.2H7.2a.2.2 0 0 1-.2-.2v-1.1c0-.11.09-.2.2-.2h1.6zm4 0c.11 0 .2.09.2.2v1.1a.2.2 0 0 1-.2.2h-1.6a.2.2 0 0 1-.2-.2v-1.1c0-.11.09-.2.2-.2h1.6zm.45-5.5a.75.75 0 1 1 0 1.5h-8.5a.75.75 0 1 1 0-1.5h8.5zM1.3 11c.11 0 .2.09.2.2v1.6a.2.2 0 0 1-.2.2H.2a.2.2 0 0 1-.2-.2v-1.6c0-.11.09-.2.2-.2h1.1zm18.5 0c.11 0 .2.09.2.2v1.6a.2.2 0 0 1-.2.2h-1.1a.2.2 0 0 1-.2-.2v-1.6c0-.11.09-.2.2-.2h1.1zm-4.55-2a.75.75 0 1 1 0 1.5H4.75a.75.75 0 1 1 0-1.5h10.5zM1.3 7c.11 0 .2.09.2.2v1.6a.2.2 0 0 1-.2.2H.2a.2.2 0 0 1-.2-.2V7.2c0-.11.09-.2.2-.2h1.1zm18.5 0c.11 0 .2.09.2.2v1.6a.2.2 0 0 1-.2.2h-1.1a.2.2 0 0 1-.2-.2V7.2c0-.11.09-.2.2-.2h1.1zm-4.55-2a.75.75 0 1 1 0 1.5h-2.5a.75.75 0 1 1 0-1.5h2.5zm-5 0a.75.75 0 1 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5h5.5zm-6.5-5a.75.75 0 0 1 0 1.5H2a.5.5 0 0 0-.492.41L1.5 2v1.75a.75.75 0 0 1-1.5 0V1.5l.007-.144A1.5 1.5 0 0 1 1.356.006L1.5 0h2.25zM18.5 0l.144.007a1.5 1.5 0 0 1 1.35 1.349L20 1.5v2.25a.75.75 0 1 1-1.5 0V2l-.008-.09A.5.5 0 0 0 18 1.5h-1.75a.75.75 0 1 1 0-1.5h2.25zM8.8 0c.11 0 .2.09.2.2v1.1a.2.2 0 0 1-.2.2H7.2a.2.2 0 0 1-.2-.2V.2c0-.11.09-.2.2-.2h1.6zm4 0c.11 0 .2.09.2.2v1.1a.2.2 0 0 1-.2.2h-1.6a.2.2 0 0 1-.2-.2V.2c0-.11.09-.2.2-.2h1.6z\"/></svg>";

/**
 * The select all UI feature.
 *
 * It registers the `'selectAll'` UI button in the editor's
 * {@link module:ui/componentfactory~ComponentFactory component factory}. When clicked, the button
 * executes the {@link module:select-all/selectallcommand~SelectAllCommand select all command}.
 */ class SelectAllUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SelectAllUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('selectAll', ()=>{
            const buttonView = this._createButton(ButtonView);
            buttonView.set({
                tooltip: true
            });
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:selectAll', ()=>{
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
	 * Creates a button for select all command to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = editor.commands.get('selectAll');
        const view = new ButtonClass(editor.locale);
        const t = locale.t;
        view.set({
            label: t('Select all'),
            icon: selectAllIcon,
            keystroke: 'Ctrl+A'
        });
        view.bind('isEnabled').to(command, 'isEnabled');
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute('selectAll');
            editor.editing.view.focus();
        });
        return view;
    }
}

/**
 * The select all feature.
 *
 * This is a "glue" plugin which loads the {@link module:select-all/selectallediting~SelectAllEditing select all editing feature}
 * and the {@link module:select-all/selectallui~SelectAllUI select all UI feature}.
 *
 * Please refer to the documentation of individual features to learn more.
 */ class SelectAll extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            SelectAllEditing,
            SelectAllUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'SelectAll';
    }
}

export { SelectAll, SelectAllEditing, SelectAllUI };
//# sourceMappingURL=index.js.map
