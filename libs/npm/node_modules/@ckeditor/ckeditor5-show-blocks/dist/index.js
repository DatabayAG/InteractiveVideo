/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, MenuBarMenuListItemButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';

/**
 * The show blocks command.
 *
 * Displays the HTML element names for content blocks.
 */ class ShowBlocksCommand extends Command {
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        // It does not affect data so should be enabled in read-only mode.
        this.affectsData = false;
        this.value = false;
    }
    /**
	 * Toggles the visibility of content blocks.
	 */ execute() {
        const CLASS_NAME = 'ck-show-blocks';
        const view = this.editor.editing.view;
        view.change((writer)=>{
            // Multiroot support.
            for (const root of view.document.roots){
                if (!root.hasClass(CLASS_NAME)) {
                    writer.addClass(CLASS_NAME, root);
                    this.value = true;
                } else {
                    writer.removeClass(CLASS_NAME, root);
                    this.value = false;
                }
            }
        });
    }
}

/**
 * The show blocks editing plugin.
 */ class ShowBlocksEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ShowBlocksEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const { editor } = this;
        editor.commands.add('showBlocks', new ShowBlocksCommand(editor));
    }
}

var showBlocksIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m6.395 9.196 2.545-.007V6.498a.598.598 0 0 1 .598-.598h.299a.598.598 0 0 1 .598.598v6.877a.598.598 0 0 1-.598.598h-.299a.598.598 0 0 1-.598-.598v-2.691l-2.545.007v2.691a.598.598 0 0 1-.598.598h-.299a.598.598 0 0 1-.598-.598V6.505a.598.598 0 0 1 .598-.598h.299a.598.598 0 0 1 .598.598v2.691Z\"/><path d=\"M15.094 13.417V6.462a.562.562 0 0 0-.562-.562h-.782a1 1 0 0 0-.39.08l-1.017.43a.562.562 0 0 0-.343.517v.197c0 .4.406.67.775.519l.819-.337v6.111c0 .31.251.562.561.562h.377c.31 0 .562-.251.562-.562Z\"/><path d=\"M0 15.417v1.5h1.5v-1.5H0Z\"/><path d=\"M18.5 15.417v1.5H20v-1.5h-1.5Z\"/><path d=\"M18.5 12.333v1.5H20v-1.5h-1.5Z\"/><path d=\"M18.5 9.25v1.5H20v-1.5h-1.5Z\"/><path d=\"M18.5 6.167v1.5H20v-1.5h-1.5Z\"/><path d=\"M0 18.5v.5a1 1 0 0 0 1 1h.5v-1.5H0Z\"/><path d=\"M3.083 18.5V20h1.5v-1.5h-1.5Z\"/><path d=\"M6.167 18.5V20h1.5v-1.5h-1.5Z\"/><path d=\"M9.25 18.5V20h1.5v-1.5h-1.5Z\"/><path d=\"M12.333 18.5V20h1.5v-1.5h-1.5Z\"/><path d=\"M15.417 18.5V20h1.5v-1.5h-1.5Z\"/><path d=\"M18.5 18.5V20h.5a1 1 0 0 0 1-1v-.5h-1.5Z\"/><path clip-rule=\"evenodd\" d=\"M0 1a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v3.583h-1.5V1.5h-17v12.333H0V1Z\"/></svg>";

/**
 * The UI plugin of the show blocks feature.
 *
 * It registers the `'showBlocks'` UI button in the editor's {@link module:ui/componentfactory~ComponentFactory component factory}
 * that toggles the visibility of the HTML element names of content blocks.
 */ class ShowBlocksUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ShowBlocksUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('showBlocks', ()=>{
            const buttonView = this._createButton(ButtonView);
            buttonView.set({
                tooltip: true,
                icon: showBlocksIcon
            });
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:showBlocks', ()=>{
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
	 * Creates a button for show blocks command to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = editor.commands.get('showBlocks');
        const view = new ButtonClass(locale);
        const t = locale.t;
        view.set({
            label: t('Show blocks')
        });
        view.bind('isEnabled').to(command);
        view.bind('isOn').to(command, 'value', command, 'isEnabled', (value, isEnabled)=>value && isEnabled);
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute('showBlocks');
            editor.editing.view.focus();
        });
        return view;
    }
}

/**
 * The show blocks feature.
 *
 * For a detailed overview, check the {@glink features/show-blocks Show blocks} feature guide.
 */ class ShowBlocks extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ShowBlocks';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ShowBlocksEditing,
            ShowBlocksUI
        ];
    }
}

export { ShowBlocks, ShowBlocksCommand, ShowBlocksEditing, ShowBlocksUI };
//# sourceMappingURL=index.js.map
