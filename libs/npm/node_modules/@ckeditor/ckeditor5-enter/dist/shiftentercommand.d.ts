/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module enter/shiftentercommand
 */
import { Command } from '@ckeditor/ckeditor5-core';
import type { Writer } from '@ckeditor/ckeditor5-engine';
/**
 * ShiftEnter command. It is used by the {@link module:enter/shiftenter~ShiftEnter ShiftEnter feature} to handle
 * the <kbd>Shift</kbd>+<kbd>Enter</kbd> keystroke.
 */
export default class ShiftEnterCommand extends Command {
    /**
     * @inheritDoc
     */
    execute(): void;
    /**
     * @inheritDoc
     */
    refresh(): void;
}
/**
 * Fired after the the {@link module:enter/shiftentercommand~ShiftEnterCommand} is finished executing.
 *
 * @eventName ~ShiftEnterCommand#afterExecute
 */
export type ShiftEnterCommandAfterExecuteEvent = {
    name: 'afterExecute';
    args: [{
        writer: Writer;
    }];
};
