/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module show-blocks/showblocksui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView, MenuBarMenuListItemButtonView } from 'ckeditor5/src/ui.js';
import showBlocksIcon from '../theme/icons/show-blocks.svg';
import '../theme/showblocks.css';
/**
 * The UI plugin of the show blocks feature.
 *
 * It registers the `'showBlocks'` UI button in the editor's {@link module:ui/componentfactory~ComponentFactory component factory}
 * that toggles the visibility of the HTML element names of content blocks.
 */
export default class ShowBlocksUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'ShowBlocksUI';
    }
    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('showBlocks', () => {
            const buttonView = this._createButton(ButtonView);
            buttonView.set({
                tooltip: true,
                icon: showBlocksIcon
            });
            return buttonView;
        });
        editor.ui.componentFactory.add('menuBar:showBlocks', () => {
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
     * Creates a button for show blocks command to use either in toolbar or in menu bar.
     */
    _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = editor.commands.get('showBlocks');
        const view = new ButtonClass(locale);
        const t = locale.t;
        view.set({
            label: t('Show blocks')
        });
        view.bind('isEnabled').to(command);
        view.bind('isOn').to(command, 'value', command, 'isEnabled', (value, isEnabled) => value && isEnabled);
        // Execute the command.
        this.listenTo(view, 'execute', () => {
            editor.execute('showBlocks');
            editor.editing.view.focus();
        });
        return view;
    }
}
