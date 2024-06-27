/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Returns a function that creates a (toolbar or menu bar) button for a basic style feature.
 */
export function getButtonCreator({ editor, commandName, plugin, icon, label, keystroke }) {
    return (ButtonClass) => {
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
        plugin.listenTo(view, 'execute', () => {
            editor.execute(commandName);
            editor.editing.view.focus();
        });
        return view;
    };
}
