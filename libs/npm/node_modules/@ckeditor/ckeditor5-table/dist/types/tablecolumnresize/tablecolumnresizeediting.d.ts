/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import type { Element } from 'ckeditor5/src/engine.js';
import TableEditing from '../tableediting.js';
import TableUtils from '../tableutils.js';
/**
 * The table column resize editing plugin.
 */
export default class TableColumnResizeEditing extends Plugin {
    /**
     * A flag indicating if the column resizing is in progress.
     */
    private _isResizingActive;
    /**
     * A flag indicating if the column resizing is allowed. It is not allowed if the editor is in read-only
     * or comments-only mode or the `TableColumnResize` plugin is disabled.
     *
     * @observable
     * @internal
     */
    _isResizingAllowed: boolean;
    /**
     * A temporary storage for the required data needed to correctly calculate the widths of the resized columns. This storage is
     * initialized when column resizing begins, and is purged upon completion.
     */
    private _resizingData;
    /**
     * DOM emitter.
     */
    private _domEmitter;
    /**
     * A local reference to the {@link module:table/tableutils~TableUtils} plugin.
     */
    private _tableUtilsPlugin;
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TableEditing, typeof TableUtils];
    /**
     * @inheritDoc
     */
    static get pluginName(): "TableColumnResizeEditing";
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * @inheritDoc
     */
    destroy(): void;
    /**
     * Returns a 'tableColumnGroup' element from the 'table'.
     *
     * @param element A 'table' or 'tableColumnGroup' element.
     * @returns A 'tableColumnGroup' element.
     */
    getColumnGroupElement(element: Element): Element | undefined;
    /**
     * Returns an array of 'tableColumn' elements.
     *
     * @param element A 'table' or 'tableColumnGroup' element.
     * @returns An array of 'tableColumn' elements.
     */
    getTableColumnElements(element: Element): Array<Element>;
    /**
     * Returns an array of table column widths.
     *
     * @param element A 'table' or 'tableColumnGroup' element.
     * @returns An array of table column widths.
     */
    getTableColumnsWidths(element: Element): Array<string>;
    /**
     * Registers new attributes for a table model element.
     */
    private _extendSchema;
    /**
     * Registers table column resize post-fixer.
     *
     * It checks if the change from the differ concerns a table-related element or attribute. For detected changes it:
     *  * Adjusts the `columnWidths` attribute to guarantee that the sum of the widths from all columns is 100%.
     *  * Checks if the `columnWidths` attribute gets updated accordingly after columns have been added or removed.
     */
    private _registerPostFixer;
    /**
     * Registers table column resize converters.
     */
    private _registerConverters;
    /**
     * Registers listeners to handle resizing process.
     */
    private _registerResizingListeners;
    /**
     * Handles the `mousedown` event on column resizer element:
     *  * calculates the initial column pixel widths,
     *  * inserts the `<colgroup>` element if it is not present in the `<table>`,
     *  * puts the necessary data in the temporary storage,
     *  * applies the attributes to the `<table>` view element.
     *
     * @param eventInfo An object containing information about the fired event.
     * @param domEventData The data related to the DOM event.
     */
    private _onMouseDownHandler;
    /**
     * Handles the `mousemove` event.
     *  * If resizing process is not in progress, it does nothing.
     *  * If resizing is active but not allowed, it stops the resizing process instantly calling the `mousedown` event handler.
     *  * Otherwise it dynamically updates the widths of the resized columns.
     *
     * @param eventInfo An object containing information about the fired event.
     * @param mouseEventData The native DOM event.
     */
    private _onMouseMoveHandler;
    /**
     * Handles the `mouseup` event.
     *  * If resizing process is not in progress, it does nothing.
     *  * If resizing is active but not allowed, it cancels the resizing process restoring the original widths.
     *  * Otherwise it propagates the changes from view to the model by executing the adequate commands.
     */
    private _onMouseUpHandler;
    /**
     * Retrieves and returns required data needed for the resizing process.
     *
     * @param domEventData The data of the `mousedown` event.
     * @param columnWidths The current widths of the columns.
     * @returns The data needed for the resizing process.
     */
    private _getResizingData;
    /**
     * Registers a listener ensuring that each resizable cell have a resizer handle.
     */
    private _registerResizerInserter;
}
