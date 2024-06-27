/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tablecolumnresize/utils
 */
import type { Editor } from 'ckeditor5/src/core.js';
import type { Element, Model, Writer } from 'ckeditor5/src/engine.js';
import type TableUtils from '../tableutils.js';
/**
 * Returns all the inserted or changed table model elements in a given change set. Only the tables
 * with 'columnsWidth' attribute are taken into account. The returned set may be empty.
 *
 * Most notably if an entire table is removed it will not be included in returned set.
 *
 * @param model The model to collect the affected elements from.
 * @returns A set of table model elements.
 */
export declare function getChangedResizedTables(model: Model): Set<Element>;
/**
 * Calculates the percentage of the minimum column width given in pixels for a given table.
 *
 * @param modelTable A table model element.
 * @param editor The editor instance.
 * @returns The minimal column width in percentage.
 */
export declare function getColumnMinWidthAsPercentage(modelTable: Element, editor: Editor): number;
/**
 * Calculates the table width in pixels.
 *
 * @param modelTable A table model element.
 * @param editor The editor instance.
 * @returns The width of the table in pixels.
 */
export declare function getTableWidthInPixels(modelTable: Element, editor: Editor): number;
/**
 * Returns the computed width (in pixels) of the DOM element without padding and borders.
 *
 * @param domElement A DOM element.
 * @returns The width of the DOM element in pixels.
 */
export declare function getElementWidthInPixels(domElement: HTMLElement): number;
/**
 * Returns the column indexes on the left and right edges of a cell. They differ if the cell spans
 * across multiple columns.
 *
 * @param cell A table cell model element.
 * @param tableUtils The Table Utils plugin instance.
 * @returns An object containing the indexes of the left and right edges of the cell.
 */
export declare function getColumnEdgesIndexes(cell: Element, tableUtils: TableUtils): {
    leftEdge: number;
    rightEdge: number;
};
/**
 * Rounds the provided value to a fixed-point number with defined number of digits after the decimal point.
 *
 * @param value A number to be rounded.
 * @returns The rounded number.
 */
export declare function toPrecision(value: number | string): number;
/**
 * Clamps the number within the inclusive lower (min) and upper (max) bounds. Returned number is rounded using the
 * {@link ~toPrecision `toPrecision()`} function.
 *
 * @param number A number to be clamped.
 * @param min A lower bound.
 * @param max An upper bound.
 * @returns The clamped number.
 */
export declare function clamp(number: number, min: number, max: number): number;
/**
 * Creates an array with defined length and fills all elements with defined value.
 *
 * @param length The length of the array.
 * @param value The value to fill the array with.
 * @returns An array with defined length and filled with defined value.
 */
export declare function createFilledArray<T>(length: number, value: T): Array<T>;
/**
 * Sums all array values that can be parsed to a float.
 *
 * @param array An array of numbers.
 * @returns The sum of all array values.
 */
export declare function sumArray(array: Array<number | string>): number;
/**
 * Makes sure that the sum of the widths from all columns is 100%. If the sum of all the widths is not equal 100%, all the widths are
 * changed proportionally so that they all sum back to 100%. If there are columns without specified width, the amount remaining
 * after assigning the known widths will be distributed equally between them.
 *
 * @param columnWidths An array of column widths.
 * @returns An array of column widths guaranteed to sum up to 100%.
 */
export declare function normalizeColumnWidths(columnWidths: Array<string>): Array<string>;
/**
 * Calculates the total horizontal space taken by the cell. That includes:
 *  * width,
 *  * left and red padding,
 *  * border width.
 *
 * @param domCell A DOM cell element.
 * @returns Width in pixels without `px` at the end.
 */
export declare function getDomCellOuterWidth(domCell: HTMLElement): number;
/**
 * Updates column elements to match columns widths.
 *
 * @param columns
 * @param tableColumnGroup
 * @param normalizedWidths
 * @param writer
 */
export declare function updateColumnElements(columns: Array<Element>, tableColumnGroup: Element, normalizedWidths: Array<string>, writer: Writer): void;
/**
 * Returns a 'tableColumnGroup' element from the 'table'.
 *
 * @internal
 * @param element A 'table' or 'tableColumnGroup' element.
 * @returns A 'tableColumnGroup' element.
 */
export declare function getColumnGroupElement(element: Element): Element;
/**
 * Returns an array of 'tableColumn' elements. It may be empty if there's no `tableColumnGroup` element.
 *
 * @internal
 * @param element A 'table' or 'tableColumnGroup' element.
 * @returns An array of 'tableColumn' elements.
 */
export declare function getTableColumnElements(element: Element): Array<Element>;
/**
 * Returns an array of table column widths.
 *
 * @internal
 * @param element A 'table' or 'tableColumnGroup' element.
 * @returns An array of table column widths.
 */
export declare function getTableColumnsWidths(element: Element): Array<string>;
/**
 * Translates the `colSpan` model attribute into additional column widths and returns the resulting array.
 *
 * @internal
 * @param element A 'table' or 'tableColumnGroup' element.
 * @param writer A writer instance.
 * @returns An array of table column widths.
 */
export declare function translateColSpanAttribute(element: Element, writer: Writer): Array<string>;
