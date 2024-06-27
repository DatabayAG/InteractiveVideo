/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/underline/underlineui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The underline UI feature. It introduces the Underline button.
 */
export default class UnderlineUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "UnderlineUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
