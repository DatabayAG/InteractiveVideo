/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type { Element, ElementCreatorFunction } from 'ckeditor5/src/engine.js';
import type TableUtils from '../tableutils.js';
import type { AdditionalSlot } from '../tableediting.js';
/**
 * Model table element to view table element conversion helper.
 */
export declare function downcastTable(tableUtils: TableUtils, options: DowncastTableOptions): ElementCreatorFunction;
/**
 * Model table row element to view `<tr>` element conversion helper.
 *
 * @returns Element creator.
 */
export declare function downcastRow(): ElementCreatorFunction;
/**
 * Model table cell element to view `<td>` or `<th>` element conversion helper.
 *
 * This conversion helper will create proper `<th>` elements for table cells that are in the heading section (heading row or column)
 * and `<td>` otherwise.
 *
 * @param options.asWidget If set to `true`, the downcast conversion will produce a widget.
 * @returns Element creator.
 */
export declare function downcastCell(options?: {
    asWidget?: boolean;
}): ElementCreatorFunction;
/**
 * Overrides paragraph inside table cell conversion.
 *
 * This converter:
 * * should be used to override default paragraph conversion.
 * * It will only convert `<paragraph>` placed directly inside `<tableCell>`.
 * * For a single paragraph without attributes it returns `<span>` to simulate data table.
 * * For all other cases it returns `<p>` element.
 *
 * @param options.asWidget If set to `true`, the downcast conversion will produce a widget.
 * @returns Element creator.
 */
export declare function convertParagraphInTableCell(options?: {
    asWidget?: boolean;
}): ElementCreatorFunction;
/**
 * Checks if given model `<paragraph>` is an only child of a parent (`<tableCell>`) and if it has any attribute set.
 *
 * The paragraph should be converted in the editing view to:
 *
 * * If returned `true` - to a `<span class="ck-table-bogus-paragraph">`
 * * If returned `false` - to a `<p>`
 */
export declare function isSingleParagraphWithoutAttributes(modelElement: Element): boolean;
export interface DowncastTableOptions {
    /**
     * If set to `true`, the downcast conversion will produce a widget.
     */
    asWidget?: boolean;
    /**
     * Array of additional slot handlers.
     */
    additionalSlots: Array<AdditionalSlot>;
}
