/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-embed/htmlembedui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The HTML embed UI plugin.
 */
export default class HtmlEmbedUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "HtmlEmbedUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for html embed command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
