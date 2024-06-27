/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/documentlist
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import List from './list.js';
/**
 * The document list feature.
 *
 * This is an obsolete plugin that exists for backward compatibility only.
 * Use the {@link module:list/list~List `List`} instead.
 *
 * @deprecated
 */
export default class DocumentList extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof List];
    /**
     * @inheritDoc
     */
    static get pluginName(): "DocumentList";
    constructor(editor: Editor);
}
