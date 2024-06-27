/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/documentlistproperties
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { logWarning } from 'ckeditor5/src/utils.js';
import ListProperties from './listproperties.js';
/**
 * The document list properties feature.
 *
 * This is an obsolete plugin that exists for backward compatibility only.
 * Use the {@link module:list/listproperties~ListProperties `ListProperties`} instead.
 *
 * @deprecated
 */
export default class DocumentListProperties extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires() {
        return [ListProperties];
    }
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'DocumentListProperties';
    }
    constructor(editor) {
        super(editor);
        /**
         * The `DocumentListProperties` plugin is obsolete. Use `ListProperties` instead.
         *
         * @error plugin-obsolete-documentlistproperties
         */
        logWarning('plugin-obsolete-documentlistproperties', { pluginName: 'DocumentListProperties' });
    }
}
