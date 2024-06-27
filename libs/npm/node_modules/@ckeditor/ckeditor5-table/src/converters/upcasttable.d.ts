/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/converters/upcasttable
 */
import type { UpcastDispatcher } from 'ckeditor5/src/engine.js';
/**
 * Returns a function that converts the table view representation:
 *
 * ```xml
 * <figure class="table"><table>...</table></figure>
 * ```
 *
 * to the model representation:
 *
 * ```xml
 * <table></table>
 * ```
 */
export declare function upcastTableFigure(): (dispatcher: UpcastDispatcher) => void;
/**
 * View table element to model table element conversion helper.
 *
 * This conversion helper converts the table element as well as table rows.
 *
 * @returns Conversion helper.
 */
export default function upcastTable(): (dispatcher: UpcastDispatcher) => void;
/**
 * A conversion helper that skips empty <tr> elements from upcasting at the beginning of the table.
 *
 * An empty row is considered a table model error but when handling clipboard data there could be rows that contain only row-spanned cells
 * and empty TR-s are used to maintain the table structure (also {@link module:table/tablewalker~TableWalker} assumes that there are only
 * rows that have related `tableRow` elements).
 *
 * *Note:* Only the first empty rows are removed because they have no meaning and it solves the issue
 * of an improper table with all empty rows.
 *
 * @returns Conversion helper.
 */
export declare function skipEmptyTableRow(): (dispatcher: UpcastDispatcher) => void;
/**
 * A converter that ensures an empty paragraph is inserted in a table cell if no other content was converted.
 *
 * @returns Conversion helper.
 */
export declare function ensureParagraphInTableCell(elementName: string): (dispatcher: UpcastDispatcher) => void;
