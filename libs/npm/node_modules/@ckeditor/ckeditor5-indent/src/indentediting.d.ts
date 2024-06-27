/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module indent/indentediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The indent editing feature.
 *
 * This plugin registers the `'indent'` and `'outdent'` commands.
 *
 * **Note**: In order for the commands to work, at least one of the compatible features is required. Read more in the
 * {@link module:indent/indent~Indent indent feature} API documentation.
 */
export default class IndentEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "IndentEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
