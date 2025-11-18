/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module show-blocks/showblockscommand
 */
import { Command, type Editor } from 'ckeditor5/src/core.js';
/**
 * The show blocks command.
 *
 * Displays the HTML element names for content blocks.
 */
export default class ShowBlocksCommand extends Command {
    /**
     * Flag indicating whether the command is active, i.e. content blocks are displayed.
     */
    value: boolean;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * Toggles the visibility of content blocks.
     */
    execute(): void;
}
