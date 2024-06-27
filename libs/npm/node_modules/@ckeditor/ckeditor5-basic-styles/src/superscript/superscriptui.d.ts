/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/superscript/superscriptui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The superscript UI feature. It introduces the Superscript button.
 */
export default class SuperscriptUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "SuperscriptUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
