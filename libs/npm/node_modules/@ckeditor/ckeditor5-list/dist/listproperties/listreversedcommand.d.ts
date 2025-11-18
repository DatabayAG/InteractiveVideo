/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/listproperties/listreversedcommand
 */
import { Command } from 'ckeditor5/src/core.js';
/**
 * The list reversed command. It changes the `listReversed` attribute of the selected list items,
 * letting the user to choose the order of an ordered list.
 * It is used by the {@link module:list/listproperties~ListProperties list properties feature}.
 */
export default class ListReversedCommand extends Command {
    /**
     * @inheritDoc
     */
    value: boolean | null;
    /**
     * @inheritDoc
     */
    refresh(): void;
    /**
     * Executes the command.
     *
     * @fires execute
     * @param options.reversed Whether the list should be reversed.
     */
    execute(options?: {
        reversed?: boolean;
    }): void;
    /**
     * Checks the command's {@link #value}.
     */
    private _getValue;
}
