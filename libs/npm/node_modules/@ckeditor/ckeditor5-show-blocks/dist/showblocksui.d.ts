/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module show-blocks/showblocksui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import '../theme/showblocks.css';
/**
 * The UI plugin of the show blocks feature.
 *
 * It registers the `'showBlocks'` UI button in the editor's {@link module:ui/componentfactory~ComponentFactory component factory}
 * that toggles the visibility of the HTML element names of content blocks.
 */
export default class ShowBlocksUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "ShowBlocksUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for show blocks command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
