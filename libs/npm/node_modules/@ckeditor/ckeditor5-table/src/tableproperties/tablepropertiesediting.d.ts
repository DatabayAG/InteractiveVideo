/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tableproperties/tablepropertiesediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import TableEditing from '../tableediting.js';
/**
 * The table properties editing feature.
 *
 * Introduces table's model attributes and their conversion:
 *
 * - border: `tableBorderStyle`, `tableBorderColor` and `tableBorderWidth`
 * - background color: `tableBackgroundColor`
 * - horizontal alignment: `tableAlignment`
 * - width & height: `tableWidth` & `tableHeight`
 *
 * It also registers commands used to manipulate the above attributes:
 *
 * - border: `'tableBorderStyle'`, `'tableBorderColor'` and `'tableBorderWidth'` commands
 * - background color: `'tableBackgroundColor'`
 * - horizontal alignment: `'tableAlignment'`
 * - width & height: `'tableWidth'` & `'tableHeight'`
 */
export default class TablePropertiesEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "TablePropertiesEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TableEditing];
    /**
     * @inheritDoc
     */
    init(): void;
}
