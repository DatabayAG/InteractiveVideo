/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module undo/basecommand
 */
import { Command, type Editor } from '@ckeditor/ckeditor5-core';
import { type Batch, type Operation, type Range } from '@ckeditor/ckeditor5-engine';
/**
 * Base class for the undo feature commands: {@link module:undo/undocommand~UndoCommand} and {@link module:undo/redocommand~RedoCommand}.
 */
export default abstract class BaseCommand extends Command {
    /**
     * Stack of items stored by the command. These are pairs of:
     *
     * * {@link module:engine/model/batch~Batch batch} saved by the command,
     * * {@link module:engine/model/selection~Selection selection} state at the moment of saving the batch.
     */
    protected _stack: Array<{
        batch: Batch;
        selection: {
            ranges: Array<Range>;
            isBackward: boolean;
        };
    }>;
    /**
     * Stores all batches that were created by this command.
     *
     * @internal
     */
    _createdBatches: WeakSet<Batch>;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    refresh(): void;
    /**
     * Returns all batches created by this command.
     */
    get createdBatches(): WeakSet<Batch>;
    /**
     * Stores a batch in the command, together with the selection state of the {@link module:engine/model/document~Document document}
     * created by the editor which this command is registered to.
     *
     * @param batch The batch to add.
     */
    addBatch(batch: Batch): void;
    /**
     * Removes all items from the stack.
     */
    clearStack(): void;
    /**
     * Restores the {@link module:engine/model/document~Document#selection document selection} state after a batch was undone.
     *
     * @param ranges Ranges to be restored.
     * @param isBackward A flag describing whether the restored range was selected forward or backward.
     * @param operations Operations which has been applied since selection has been stored.
     */
    protected _restoreSelection(ranges: Array<Range>, isBackward: boolean, operations: Array<Operation>): void;
    /**
     * Undoes a batch by reversing that batch, transforming reversed batch and finally applying it.
     * This is a helper method for {@link #execute}.
     *
     * @param batchToUndo The batch to be undone.
     * @param undoingBatch The batch that will contain undoing changes.
     */
    protected _undo(batchToUndo: Batch, undoingBatch: Batch): void;
}
