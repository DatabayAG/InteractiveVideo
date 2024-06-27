/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module undo/undocommand
 */
import BaseCommand from './basecommand.js';
import type { Batch } from '@ckeditor/ckeditor5-engine';
/**
 * The undo command stores {@link module:engine/model/batch~Batch batches} applied to the
 * {@link module:engine/model/document~Document document} and is able to undo a batch by reversing it and transforming by
 * batches from {@link module:engine/model/document~Document#history history} that happened after the reversed batch.
 *
 * The undo command also takes care of restoring the {@link module:engine/model/document~Document#selection document selection}.
 */
export default class UndoCommand extends BaseCommand {
    /**
     * Executes the command. This method reverts a {@link module:engine/model/batch~Batch batch} added to the command's stack, transforms
     * and applies the reverted version on the {@link module:engine/model/document~Document document} and removes the batch from the stack.
     * Then, it restores the {@link module:engine/model/document~Document#selection document selection}.
     *
     * @fires execute
     * @fires revert
     * @param batch A batch that should be undone. If not set, the last added batch will be undone.
     */
    execute(batch?: Batch | null): void;
}
/**
 * Fired when execution of the command reverts some batch.
 *
 * @eventName ~UndoCommand#revert
 */
export type UndoCommandRevertEvent = {
    name: 'revert';
    args: [batch: Batch, undoingBatch: Batch];
};
