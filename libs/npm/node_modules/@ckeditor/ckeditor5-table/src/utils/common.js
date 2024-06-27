/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { downcastAttributeToStyle, upcastStyleToAttribute } from './../converters/tableproperties.js';
/**
 * A common method to update the numeric value. If a value is the default one, it will be unset.
 *
 * @param key An attribute key.
 * @param value The new attribute value.
 * @param item A model item on which the attribute will be set.
 * @param defaultValue The default attribute value. If a value is lower or equal, it will be unset.
 */
export function updateNumericAttribute(key, value, item, writer, defaultValue = 1) {
    if (value !== undefined && value !== null && defaultValue !== undefined && defaultValue !== null && value > defaultValue) {
        writer.setAttribute(key, value, item);
    }
    else {
        writer.removeAttribute(key, item);
    }
}
/**
 * A common method to create an empty table cell. It creates a proper model structure as a table cell must have at least one block inside.
 *
 * @param writer The model writer.
 * @param insertPosition The position at which the table cell should be inserted.
 * @param attributes The element attributes.
 * @returns Created table cell.
 */
export function createEmptyTableCell(writer, insertPosition, attributes = {}) {
    const tableCell = writer.createElement('tableCell', attributes);
    writer.insertElement('paragraph', tableCell);
    writer.insert(tableCell, insertPosition);
    return tableCell;
}
/**
 * Checks if a table cell belongs to the heading column section.
 */
export function isHeadingColumnCell(tableUtils, tableCell) {
    const table = tableCell.parent.parent;
    const headingColumns = parseInt(table.getAttribute('headingColumns') || '0');
    const { column } = tableUtils.getCellLocation(tableCell);
    return !!headingColumns && column < headingColumns;
}
/**
 * Enables conversion for an attribute for simple view-model mappings.
 *
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 */
export function enableProperty(schema, conversion, options) {
    const { modelAttribute } = options;
    schema.extend('tableCell', {
        allowAttributes: [modelAttribute]
    });
    upcastStyleToAttribute(conversion, { viewElement: /^(td|th)$/, ...options });
    downcastAttributeToStyle(conversion, { modelElement: 'tableCell', ...options });
}
/**
 * Depending on the position of the selection we either return the table under cursor or look for the table higher in the hierarchy.
 */
export function getSelectionAffectedTable(selection) {
    const selectedElement = selection.getSelectedElement();
    // Is the command triggered from the `tableToolbar`?
    if (selectedElement && selectedElement.is('element', 'table')) {
        return selectedElement;
    }
    return selection.getFirstPosition().findAncestor('table');
}
