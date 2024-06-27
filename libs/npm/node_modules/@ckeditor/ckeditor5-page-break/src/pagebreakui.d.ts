/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module page-break/pagebreakui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The page break UI plugin.
 */
export default class PageBreakUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "PageBreakUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for page break command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
