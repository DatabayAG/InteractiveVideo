/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module undo/undoui
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
/**
 * The undo UI feature. It introduces the `'undo'` and `'redo'` buttons to the editor.
 */
export default class UndoUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "UndoUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for the specified command.
     *
     * @param name Command name.
     * @param label Button label.
     * @param keystroke Command keystroke.
     * @param Icon Source of the icon.
     */
    private _addButtonsToFactory;
    /**
     * TODO
     */
    private _createButton;
}
