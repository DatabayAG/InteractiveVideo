/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module remove-format/removeformatui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The remove format UI plugin. It registers the `'removeFormat'` button which can be
 * used in the toolbar.
 */
export default class RemoveFormatUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "RemoveFormatUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for remove format command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
