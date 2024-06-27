/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/utils/structure
 */
import type { Element, Writer } from 'ckeditor5/src/engine.js';
import { type TableSlot } from '../tablewalker.js';
import type TableUtils from '../tableutils.js';
/**
 * Returns a cropped table according to given dimensions.

 * To return a cropped table that starts at first row and first column and end in third row and column:
 *
 * ```ts
 * const croppedTable = cropTableToDimensions( table, {
 *   startRow: 1,
 *   endRow: 3,
 *   startColumn: 1,
 *   endColumn: 3
 * }, writer );
 * ```
 *
 * Calling the code above for the table below:
 *
 *        0   1   2   3   4                      0   1   2
 *      ┌───┬───┬───┬───┬───┐
 *   0  │ a │ b │ c │ d │ e │
 *      ├───┴───┤   ├───┴───┤                  ┌───┬───┬───┐
 *   1  │ f     │   │ g     │                  │   │   │ g │  0
 *      ├───┬───┴───┼───┬───┤   will return:   ├───┴───┼───┤
 *   2  │ h │ i     │ j │ k │                  │ i     │ j │  1
 *      ├───┤       ├───┤   │                  │       ├───┤
 *   3  │ l │       │ m │   │                  │       │ m │  2
 *      ├───┼───┬───┤   ├───┤                  └───────┴───┘
 *   4  │ n │ o │ p │   │ q │
 *      └───┴───┴───┴───┴───┘
 */
export declare function cropTableToDimensions(sourceTable: Element, cropDimensions: {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
}, writer: Writer): Element;
/**
 * Returns slot info of cells that starts above and overlaps a given row.
 *
 * In a table below, passing `overlapRow = 3`
 *
 *     ┌───┬───┬───┬───┬───┐
 *  0  │ a │ b │ c │ d │ e │
 *     │   ├───┼───┼───┼───┤
 *  1  │   │ f │ g │ h │ i │
 *     ├───┤   ├───┼───┤   │
 *  2  │ j │   │ k │ l │   │
 *     │   │   │   ├───┼───┤
 *  3  │   │   │   │ m │ n │  <- overlap row to check
 *     ├───┼───┤   │   ├───│
 *  4  │ o │ p │   │   │ q │
 *     └───┴───┴───┴───┴───┘
 *
 * will return slot info for cells: "j", "f", "k".
 *
 * @param table The table to check.
 * @param overlapRow The index of the row to check.
 * @param startRow row to start analysis. Use it when it is known that the cells above that row will not overlap. Default value is 0.
 */
export declare function getVerticallyOverlappingCells(table: Element, overlapRow: number, startRow?: number): Array<TableSlot>;
/**
 * Splits the table cell horizontally.
 *
 * @returns Created table cell, if any were created.
 */
export declare function splitHorizontally(tableCell: Element, splitRow: number, writer: Writer): Element | null;
/**
 * Returns slot info of cells that starts before and overlaps a given column.
 *
 * In a table below, passing `overlapColumn = 3`
 *
 *    0   1   2   3   4
 *  ┌───────┬───────┬───┐
 *  │ a     │ b     │ c │
 *  │───┬───┴───────┼───┤
 *  │ d │ e         │ f │
 *  ├───┼───┬───────┴───┤
 *  │ g │ h │ i         │
 *  ├───┼───┼───┬───────┤
 *  │ j │ k │ l │ m     │
 *  ├───┼───┴───┼───┬───┤
 *  │ n │ o     │ p │ q │
 *  └───┴───────┴───┴───┘
 *                ^
 *                Overlap column to check
 *
 * will return slot info for cells: "b", "e", "i".
 *
 * @param table The table to check.
 * @param overlapColumn The index of the column to check.
 */
export declare function getHorizontallyOverlappingCells(table: Element, overlapColumn: number): Array<TableSlot>;
/**
 * Splits the table cell vertically.
 *
 * @param columnIndex The table cell column index.
 * @param splitColumn The index of column to split cell on.
 * @returns Created table cell.
 */
export declare function splitVertically(tableCell: Element, columnIndex: number, splitColumn: number, writer: Writer): Element;
/**
 * Adjusts table cell dimensions to not exceed limit row and column.
 *
 * If table cell width (or height) covers a column (or row) that is after a limit column (or row)
 * this method will trim "colspan" (or "rowspan") attribute so the table cell will fit in a defined limits.
 */
export declare function trimTableCellIfNeeded(tableCell: Element, cellRow: number, cellColumn: number, limitRow: number, limitColumn: number, writer: Writer): void;
/**
 * Removes columns that have no cells anchored.
 *
 * In table below:
 *
 *     +----+----+----+----+----+----+----+
 *     | 00 | 01      | 03 | 04      | 06 |
 *     +----+----+----+----+         +----+
 *     | 10 | 11      | 13 |         | 16 |
 *     +----+----+----+----+----+----+----+
 *     | 20 | 21      | 23 | 24      | 26 |
 *     +----+----+----+----+----+----+----+
 *                  ^--- empty ---^
 *
 * Will remove columns 2 and 5.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing table modifications.
 * To remove a column from a table use {@link module:table/tableutils~TableUtils#removeColumns `TableUtils.removeColumns()`}.
 *
 * @internal
 * @returns True if removed some columns.
 */
export declare function removeEmptyColumns(table: Element, tableUtils: TableUtils): boolean;
/**
 * Removes rows that have no cells anchored.
 *
 * In table below:
 *
 *     +----+----+----+
 *     | 00 | 01 | 02 |
 *     +----+----+----+
 *     | 10 | 11 | 12 |
 *     +    +    +    +
 *     |    |    |    | <-- empty
 *     +----+----+----+
 *     | 30 | 31 | 32 |
 *     +----+----+----+
 *     | 40      | 42 |
 *     +         +    +
 *     |         |    | <-- empty
 *     +----+----+----+
 *     | 60 | 61 | 62 |
 *     +----+----+----+
 *
 * Will remove rows 2 and 5.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing table modifications.
 * To remove a row from a table use {@link module:table/tableutils~TableUtils#removeRows `TableUtils.removeRows()`}.
 *
 * @internal
 * @returns True if removed some rows.
 */
export declare function removeEmptyRows(table: Element, tableUtils: TableUtils): boolean;
/**
 * Removes rows and columns that have no cells anchored.
 *
 * In table below:
 *
 *     +----+----+----+----+
 *     | 00      | 02      |
 *     +----+----+         +
 *     | 10      |         |
 *     +----+----+----+----+
 *     | 20      | 22 | 23 |
 *     +         +    +    +
 *     |         |    |    | <-- empty row
 *     +----+----+----+----+
 *             ^--- empty column
 *
 * Will remove row 3 and column 1.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing table modifications.
 * To remove a rows from a table use {@link module:table/tableutils~TableUtils#removeRows `TableUtils.removeRows()`} and
 * {@link module:table/tableutils~TableUtils#removeColumns `TableUtils.removeColumns()`} to remove a column.
 *
 * @internal
 */
export declare function removeEmptyRowsColumns(table: Element, tableUtils: TableUtils): void;
/**
 * Returns adjusted last row index if selection covers part of a row with empty slots (spanned by other cells).
 * The `dimensions.lastRow` is equal to last row index but selection might be bigger.
 *
 * This happens *only* on rectangular selection so we analyze a case like this:
 *
 *        +---+---+---+---+
 *      0 | a | b | c | d |
 *        +   +   +---+---+
 *      1 |   | e | f | g |
 *        +   +---+   +---+
 *      2 |   | h |   | i | <- last row, each cell has rowspan = 2,
 *        +   +   +   +   +    so we need to return 3, not 2
 *      3 |   |   |   |   |
 *        +---+---+---+---+
 *
 * @returns Adjusted last row index.
 */
export declare function adjustLastRowIndex(table: Element, dimensions: {
    firstRow: number;
    firstColumn: number;
    lastRow: number;
    lastColumn: number;
}): number;
/**
 * Returns adjusted last column index if selection covers part of a column with empty slots (spanned by other cells).
 * The `dimensions.lastColumn` is equal to last column index but selection might be bigger.
 *
 * This happens *only* on rectangular selection so we analyze a case like this:
 *
 *       0   1   2   3
 *     +---+---+---+---+
 *     | a             |
 *     +---+---+---+---+
 *     | b | c | d     |
 *     +---+---+---+---+
 *     | e     | f     |
 *     +---+---+---+---+
 *     | g | h         |
 *     +---+---+---+---+
 *               ^
 *              last column, each cell has colspan = 2, so we need to return 3, not 2
 *
 * @returns Adjusted last column index.
 */
export declare function adjustLastColumnIndex(table: Element, dimensions: {
    firstRow: number;
    firstColumn: number;
    lastRow: number;
    lastColumn: number;
}): number;
