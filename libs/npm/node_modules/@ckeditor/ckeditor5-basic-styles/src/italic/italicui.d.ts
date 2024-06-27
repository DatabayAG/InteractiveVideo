/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/italic/italicui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The italic UI feature. It introduces the Italic button.
 */
export default class ItalicUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "ItalicUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
