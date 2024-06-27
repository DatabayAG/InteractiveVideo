/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module show-blocks/showblocksediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import ShowBlocksCommand from './showblockscommand.js';
/**
 * The show blocks editing plugin.
 */
export default class ShowBlocksEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'ShowBlocksEditing';
    }
    /**
     * @inheritDoc
     */
    init() {
        const { editor } = this;
        editor.commands.add('showBlocks', new ShowBlocksCommand(editor));
    }
}
