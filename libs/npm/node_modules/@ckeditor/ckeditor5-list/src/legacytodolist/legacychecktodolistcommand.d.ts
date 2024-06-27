/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/legacytodolist/legacychecktodolistcommand
 */
import { Command, type Editor } from 'ckeditor5/src/core.js';
import type { Element } from 'ckeditor5/src/engine.js';
/**
 * The check to-do command.
 *
 * The command is registered by the {@link module:list/legacytodolist/legacytodolistediting~LegacyTodoListEditing} as
 * the `checkTodoList` editor command and it is also available via aliased `todoListCheck` name.
 */
export default class LegacyCheckTodoListCommand extends Command {
    /**
     * A list of to-do list items selected by the {@link module:engine/model/selection~Selection}.
     *
     * @observable
     * @readonly
     */
    value: boolean;
    /**
     * A list of to-do list items selected by the {@link module:engine/model/selection~Selection}.
     *
     * @internal
     */
    _selectedElements: Array<Element>;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * Updates the command's {@link #value} and {@link #isEnabled} properties based on the current selection.
     */
    refresh(): void;
    /**
     * Gets all to-do list items selected by the {@link module:engine/model/selection~Selection}.
     */
    private _getSelectedItems;
    /**
     * Executes the command.
     *
     * @param options.forceValue If set, it will force the command behavior. If `true`, the command will apply
     * the attribute. Otherwise, the command will remove the attribute. If not set, the command will look for its current
     * value to decide what it should do.
     */
    execute(options?: {
        forceValue?: boolean;
    }): void;
}
