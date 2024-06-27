/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tablekeyboard
 */
import TableSelection from './tableselection.js';
import TableUtils from './tableutils.js';
import { Plugin } from 'ckeditor5/src/core.js';
import { type ArrowKeyCodeDirection } from 'ckeditor5/src/utils.js';
import type { Element } from 'ckeditor5/src/engine.js';
/**
 * This plugin enables keyboard navigation for tables.
 * It is loaded automatically by the {@link module:table/table~Table} plugin.
 */
export default class TableKeyboard extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "TableKeyboard";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TableSelection, typeof TableUtils];
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Handles {@link module:engine/view/document~Document#event:tab tab} events for the <kbd>Tab</kbd> key executed
     * when the table widget is selected.
     */
    private _handleTabOnSelectedTable;
    /**
     * Handles {@link module:engine/view/document~Document#event:tab tab} events for the <kbd>Tab</kbd> key executed
     * inside table cells.
     */
    private _handleTab;
    /**
     * Handles {@link module:engine/view/document~Document#event:keydown keydown} events.
     */
    private _onArrowKey;
    /**
     * Handles arrow keys to move the selection around the table.
     *
     * @param direction The direction of the arrow key.
     * @param expandSelection If the current selection should be expanded.
     * @returns Returns `true` if key was handled.
     */
    private _handleArrowKeys;
    /**
     * Returns `true` if the selection is at the boundary of a table cell according to the navigation direction.
     *
     * @param selection The current selection.
     * @param tableCell The current table cell element.
     * @param isForward The expected navigation direction.
     */
    private _isSelectionAtCellEdge;
    /**
     * Moves the selection from the given table cell in the specified direction.
     *
     * @param focusCell The table cell that is current multi-cell selection focus.
     * @param direction Direction in which selection should move.
     * @param expandSelection If the current selection should be expanded. Default value is false.
     */
    protected _navigateFromCellInDirection(focusCell: Element, direction: ArrowKeyCodeDirection, expandSelection?: boolean): void;
}
