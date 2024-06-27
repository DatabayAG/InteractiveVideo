/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module horizontal-line/horizontallineediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import '../theme/horizontalline.css';
/**
 * The horizontal line editing feature.
 */
export default class HorizontalLineEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "HorizontalLineEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
