/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tablecellproperties/tablecellpropertiesediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import TableEditing from './../tableediting.js';
import TableCellWidthEditing from '../tablecellwidth/tablecellwidthediting.js';
/**
 * The table cell properties editing feature.
 *
 * Introduces table cell model attributes and their conversion:
 *
 * - border: `tableCellBorderStyle`, `tableCellBorderColor` and `tableCellBorderWidth`
 * - background color: `tableCellBackgroundColor`
 * - cell padding: `tableCellPadding`
 * - horizontal and vertical alignment: `tableCellHorizontalAlignment`, `tableCellVerticalAlignment`
 * - cell width and height: `tableCellWidth`, `tableCellHeight`
 *
 * It also registers commands used to manipulate the above attributes:
 *
 * - border: the `'tableCellBorderStyle'`, `'tableCellBorderColor'` and `'tableCellBorderWidth'` commands
 * - background color: the `'tableCellBackgroundColor'` command
 * - cell padding: the `'tableCellPadding'` command
 * - horizontal and vertical alignment: the `'tableCellHorizontalAlignment'` and `'tableCellVerticalAlignment'` commands
 * - width and height: the `'tableCellWidth'` and `'tableCellHeight'` commands
 */
export default class TableCellPropertiesEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "TableCellPropertiesEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TableEditing, typeof TableCellWidthEditing];
    /**
     * @inheritDoc
     */
    init(): void;
}
