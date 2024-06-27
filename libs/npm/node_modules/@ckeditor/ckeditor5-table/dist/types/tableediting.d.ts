/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tableediting
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import type { PositionOffset, SlotFilter } from 'ckeditor5/src/engine.js';
import TableUtils from '../src/tableutils.js';
import '../theme/tableediting.css';
/**
 * The table editing feature.
 */
export default class TableEditing extends Plugin {
    /**
     * Handlers for creating additional slots in the table.
     */
    private _additionalSlots;
    /**
     * @inheritDoc
     */
    static get pluginName(): "TableEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TableUtils];
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Registers downcast handler for the additional table slot.
     */
    registerAdditionalSlot(slotHandler: AdditionalSlot): void;
}
/**
 * By default, only the `tableRow` elements from the `table` model are downcast inside the `<table>` and
 * all other elements are pushed outside the table. This handler allows creating additional slots inside
 * the table for other elements.
 *
 * Take this model as an example:
 *
 * ```xml
 * <table>
 *   <tableRow>...</tableRow>
 *   <tableRow>...</tableRow>
 *   <tableColumnGroup>...</tableColumnGroup>
 * </table>
 * ```
 *
 * By default, downcasting result will be:
 *
 * ```xml
 * <table>
 *   <tbody>
 *     <tr>...</tr>
 *     <tr>...</tr>
 *   </tbody>
 * </table>
 * <colgroup>...</colgroup>
 * ```
 *
 * To allow the `tableColumnGroup` element at the end of the table, use the following configuration:
 *
 * ```ts
 * const additionalSlot = {
 *   filter: element => element.is( 'element', 'tableColumnGroup' ),
 *   positionOffset: 'end'
 * }
 * ```
 *
 * Now, the downcast result will be:
 *
 * ```xml
 * <table>
 *   <tbody>
 *     <tr>...</tr>
 *     <tr>...</tr>
 *   </tbody>
 *   <colgroup>...</colgroup>
 * </table>
 * ```
 */
export interface AdditionalSlot {
    /**
     * Filter for elements that should be placed inside given slot.
     */
    filter: SlotFilter;
    /**
     * Position of the slot within the table.
     */
    positionOffset: PositionOffset;
}
