/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module restricted-editing/restrictededitingexceptioncommand
 */
import { Command } from 'ckeditor5/src/core.js';
/**
 * The command that toggles exceptions from the restricted editing on text.
 */
export default class RestrictedEditingExceptionCommand extends Command {
    /**
     * A flag indicating whether the command is active
     *
     * @readonly
     */
    value: boolean;
    /**
     * @inheritDoc
     */
    refresh(): void;
    /**
     * @inheritDoc
     */
    execute(options?: RestrictedEditingExceptionCommandParams): void;
}
export interface RestrictedEditingExceptionCommandParams {
    forceValue?: unknown;
}
