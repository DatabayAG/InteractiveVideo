/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/utils/common
 */
import type { Conversion, Element, Item, Position, Schema, Writer, DocumentSelection } from 'ckeditor5/src/engine.js';
import type TableUtils from '../tableutils.js';
/**
 * A common method to update the numeric value. If a value is the default one, it will be unset.
 *
 * @param key An attribute key.
 * @param value The new attribute value.
 * @param item A model item on which the attribute will be set.
 * @param defaultValue The default attribute value. If a value is lower or equal, it will be unset.
 */
export declare function updateNumericAttribute(key: string, value: unknown, item: Item, writer: Writer, defaultValue?: unknown): void;
/**
 * A common method to create an empty table cell. It creates a proper model structure as a table cell must have at least one block inside.
 *
 * @param writer The model writer.
 * @param insertPosition The position at which the table cell should be inserted.
 * @param attributes The element attributes.
 * @returns Created table cell.
 */
export declare function createEmptyTableCell(writer: Writer, insertPosition: Position, attributes?: Record<string, unknown>): Element;
/**
 * Checks if a table cell belongs to the heading column section.
 */
export declare function isHeadingColumnCell(tableUtils: TableUtils, tableCell: Element): boolean;
/**
 * Enables conversion for an attribute for simple view-model mappings.
 *
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 */
export declare function enableProperty(schema: Schema, conversion: Conversion, options: {
    modelAttribute: string;
    styleName: string;
    defaultValue: string;
    reduceBoxSides?: boolean;
}): void;
/**
 * Depending on the position of the selection we either return the table under cursor or look for the table higher in the hierarchy.
 */
export declare function getSelectionAffectedTable(selection: DocumentSelection): Element;
