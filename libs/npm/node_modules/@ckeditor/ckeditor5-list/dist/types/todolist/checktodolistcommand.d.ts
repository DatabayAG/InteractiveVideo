/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/todolist/checktodolistcommand
 */
import { Command, type Editor } from 'ckeditor5/src/core.js';
/**
 * The check to-do command.
 *
 * The command is registered by the {@link module:list/todolist/todolistediting~TodoListEditing} as
 * the `checkTodoList` editor command.
 */
export default class CheckTodoListCommand extends Command {
    /**
     * A list of to-do list items selected by the {@link module:engine/model/selection~Selection}.
     *
     * @observable
     * @readonly
     */
    value: boolean;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * Updates the command's {@link #value} and {@link #isEnabled} properties based on the current selection.
     */
    refresh(): void;
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
    /**
     * Returns a value for the command.
     */
    private _getValue;
    /**
     * Gets all to-do list items selected by the {@link module:engine/model/selection~Selection}.
     */
    private _getSelectedItems;
}
