/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The indent UI feature.
 *
 * This plugin registers the `'indent'` and `'outdent'` buttons.
 *
 * **Note**: In order for the commands to work, at least one of the compatible features is required. Read more in
 * the {@link module:indent/indent~Indent indent feature} API documentation.
 */
export default class IndentUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "IndentUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Defines UI buttons for both toolbar and menu bar.
     */
    private _defineButton;
    /**
     * Creates a button to use either in toolbar or in menu bar.
     */
    private _createButton;
}
