/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module list/list
 */
import { Plugin } from 'ckeditor5/src/core.js';
import ListEditing from './list/listediting.js';
import ListUI from './list/listui.js';
/**
 * The list feature.
 *
 * This is a "glue" plugin that loads the {@link module:list/list/listediting~ListEditing  list
 * editing feature} and {@link module:list/list/listui~ListUI list UI feature}.
 */
export default class List extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ListEditing, typeof ListUI];
    /**
     * @inheritDoc
     */
    static get pluginName(): "List";
}
