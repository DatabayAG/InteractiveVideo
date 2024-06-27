/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module code-block/codeblockui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import '../theme/codeblock.css';
/**
 * The code block UI plugin.
 *
 * Introduces the `'codeBlock'` dropdown.
 */
export default class CodeBlockUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CodeBlockUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * A helper returning a collection of the `codeBlock` dropdown items representing languages
     * available for the user to choose from.
     */
    private _getLanguageListItemDefinitions;
}
