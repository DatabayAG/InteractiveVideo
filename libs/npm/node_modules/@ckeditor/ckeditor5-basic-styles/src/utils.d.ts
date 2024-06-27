/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/utils
 */
import type { Editor, Plugin } from 'ckeditor5/src/core.js';
import type { ButtonView, MenuBarMenuListItemButtonView } from 'ckeditor5/src/ui.js';
/**
 * Returns a function that creates a (toolbar or menu bar) button for a basic style feature.
 */
export declare function getButtonCreator({ editor, commandName, plugin, icon, label, keystroke }: {
    editor: Editor;
    commandName: string;
    icon: string;
    label: string;
    plugin: Plugin;
    keystroke?: string;
}): <T extends typeof ButtonView | typeof MenuBarMenuListItemButtonView>(ButtonClass: T) => InstanceType<T>;
