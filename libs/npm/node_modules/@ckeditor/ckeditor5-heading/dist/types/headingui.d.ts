/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module heading/headingui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import '../theme/heading.css';
/**
 * The headings UI feature. It introduces the `headings` dropdown.
 */
export default class HeadingUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "HeadingUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
