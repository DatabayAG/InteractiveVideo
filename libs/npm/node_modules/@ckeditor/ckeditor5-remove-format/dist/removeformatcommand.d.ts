/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command } from 'ckeditor5/src/core.js';
/**
 * The remove format command.
 *
 * It is used by the {@link module:remove-format/removeformat~RemoveFormat remove format feature}
 * to clear the formatting in the selection.
 *
 * ```ts
 * editor.execute( 'removeFormat' );
 * ```
 */
export default class RemoveFormatCommand extends Command {
    value: boolean;
    /**
     * @inheritDoc
     */
    refresh(): void;
    /**
     * @inheritDoc
     */
    execute(): void;
    /**
     * Returns an iterable of items in a selection (including the selection itself) that have formatting model
     * attributes to be removed by the feature.
     *
     * @param schema The schema describing the item.
     */
    private _getFormattingItems;
    /**
     * Returns an iterable of formatting attributes of a given model item.
     *
     * **Note:** Formatting items have the `isFormatting` property set to `true`.
     *
     * @param schema The schema describing the item.
     * @returns The names of formatting attributes found in a given item.
     */
    private _getFormattingAttributes;
}
