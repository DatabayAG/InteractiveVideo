/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/bold/boldediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The bold editing feature.
 *
 * It registers the `'bold'` command and introduces the `bold` attribute in the model which renders to the view
 * as a `<strong>` element.
 */
export default class BoldEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "BoldEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
