/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module restricted-editing/standardeditingmodeui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView, MenuBarMenuListItemButtonView } from 'ckeditor5/src/ui.js';
import unlockIcon from '../theme/icons/contentunlock.svg';
/**
 * The standard editing mode UI feature.
 *
 * It introduces the `'restrictedEditingException'` button that marks text as unrestricted for editing.
 */
export default class StandardEditingModeUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'StandardEditingModeUI';
    }
    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('restrictedEditingException', () => {
            const button = this._createButton(ButtonView);
            button.set({
                tooltip: true,
                isToggleable: true
            });
            return button;
        });
        editor.ui.componentFactory.add('menuBar:restrictedEditingException', () => {
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
     * Creates a button for restricted editing exception command to use either in toolbar or in menu bar.
     */
    _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = this.editor.commands.get('restrictedEditingException');
        const view = new ButtonClass(locale);
        const t = locale.t;
        view.icon = unlockIcon;
        view.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');
        view.bind('label').to(command, 'value', value => {
            return value ? t('Disable editing') : t('Enable editing');
        });
        // Execute the command.
        this.listenTo(view, 'execute', () => {
            editor.execute('restrictedEditingException');
            editor.editing.view.focus();
        });
        return view;
    }
}
