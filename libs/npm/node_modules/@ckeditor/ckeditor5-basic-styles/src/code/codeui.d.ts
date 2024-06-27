/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/code/codeui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import '../../theme/code.css';
/**
 * The code UI feature. It introduces the Code button.
 */
export default class CodeUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CodeUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
