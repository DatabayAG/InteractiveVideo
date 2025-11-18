/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module restricted-editing/standardeditingmodeui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The standard editing mode UI feature.
 *
 * It introduces the `'restrictedEditingException'` button that marks text as unrestricted for editing.
 */
export default class StandardEditingModeUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "StandardEditingModeUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for restricted editing exception command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
