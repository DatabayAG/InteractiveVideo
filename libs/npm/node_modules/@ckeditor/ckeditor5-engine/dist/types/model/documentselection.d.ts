/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/documentselection
 */
import TypeCheckable from './typecheckable.js';
import Selection, { type SelectionChangeAttributeEvent, type SelectionChangeRangeEvent } from './selection.js';
import type { default as Document } from './document.js';
import type { Marker } from './markercollection.js';
import type Element from './element.js';
import type Item from './item.js';
import type { default as Position, PositionOffset } from './position.js';
import type Range from './range.js';
import { Collection } from '@ckeditor/ckeditor5-utils';
declare const DocumentSelection_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof TypeCheckable, import("@ckeditor/ckeditor5-utils").Emitter>;
/**
 * `DocumentSelection` is a special selection which is used as the
 * {@link module:engine/model/document~Document#selection document's selection}.
 * There can be only one instance of `DocumentSelection` per document.
 *
 * Document selection can only be changed by using the {@link module:engine/model/writer~Writer} instance
 * inside the {@link module:engine/model/model~Model#change `change()`} block, as it provides a secure way to modify model.
 *
 * `DocumentSelection` is automatically updated upon changes in the {@link module:engine/model/document~Document document}
 * to always contain valid ranges. Its attributes are inherited from the text unless set explicitly.
 *
 * Differences between {@link module:engine/model/selection~Selection} and `DocumentSelection` are:
 * * there is always a range in `DocumentSelection` - even if no ranges were added there is a "default range"
 * present in the selection,
 * * ranges added to this selection updates automatically when the document changes,
 * * attributes of `DocumentSelection` are updated automatically according to selection ranges.
 *
 * Since `DocumentSelection` uses {@link module:engine/model/liverange~LiveRange live ranges}
 * and is updated when {@link module:engine/model/document~Document document}
 * changes, it cannot be set on {@link module:engine/model/node~Node nodes}
 * that are inside {@link module:engine/model/documentfragment~DocumentFragment document fragment}.
 * If you need to represent a selection in document fragment,
 * use {@link module:engine/model/selection~Selection Selection class} instead.
 */
export default class DocumentSelection extends /* #__PURE__ */ DocumentSelection_base {
    /**
     * Selection used internally by that class (`DocumentSelection` is a proxy to that selection).
     */
    private _selection;
    /**
     * Creates an empty live selection for given {@link module:engine/model/document~Document}.
     *
     * @param doc Document which owns this selection.
     */
    constructor(doc: Document);
    /**
     * Describes whether the selection is collapsed. Selection is collapsed when there is exactly one range which is
     * collapsed.
     */
    get isCollapsed(): boolean;
    /**
     * Selection anchor. Anchor may be described as a position where the most recent part of the selection starts.
     * Together with {@link #focus} they define the direction of selection, which is important
     * when expanding/shrinking selection. Anchor is always {@link module:engine/model/range~Range#start start} or
     * {@link module:engine/model/range~Range#end end} position of the most recently added range.
     *
     * Is set to `null` if there are no ranges in selection.
     *
     * @see #focus
     */
    get anchor(): Position | null;
    /**
     * Selection focus. Focus is a position where the selection ends.
     *
     * Is set to `null` if there are no ranges in selection.
     *
     * @see #anchor
     */
    get focus(): Position | null;
    /**
     * Number of ranges in selection.
     */
    get rangeCount(): number;
    /**
     * Describes whether `Documentselection` has own range(s) set, or if it is defaulted to
     * {@link module:engine/model/document~Document#_getDefaultRange document's default range}.
     */
    get hasOwnRange(): boolean;
    /**
     * Specifies whether the {@link #focus}
     * precedes {@link #anchor}.
     *
     * @readonly
     * @type {Boolean}
     */
    get isBackward(): boolean;
    /**
     * Describes whether the gravity is overridden (using {@link module:engine/model/writer~Writer#overrideSelectionGravity}) or not.
     *
     * Note that the gravity remains overridden as long as will not be restored the same number of times as it was overridden.
     */
    get isGravityOverridden(): boolean;
    /**
     * A collection of selection {@link module:engine/model/markercollection~Marker markers}.
     * Marker is a selection marker when selection range is inside the marker range.
     *
     * **Note**: Only markers from {@link ~DocumentSelection#observeMarkers observed markers groups} are collected.
     */
    get markers(): Collection<Marker>;
    /**
     * Used for the compatibility with the {@link module:engine/model/selection~Selection#isEqual} method.
     *
     * @internal
     */
    get _ranges(): Array<Range>;
    /**
     * Returns an iterable that iterates over copies of selection ranges.
     */
    getRanges(): IterableIterator<Range>;
    /**
     * Returns the first position in the selection.
     * First position is the position that {@link module:engine/model/position~Position#isBefore is before}
     * any other position in the selection.
     *
     * Returns `null` if there are no ranges in selection.
     */
    getFirstPosition(): Position | null;
    /**
     * Returns the last position in the selection.
     * Last position is the position that {@link module:engine/model/position~Position#isAfter is after}
     * any other position in the selection.
     *
     * Returns `null` if there are no ranges in selection.
     */
    getLastPosition(): Position | null;
    /**
     * Returns a copy of the first range in the selection.
     * First range is the one which {@link module:engine/model/range~Range#start start} position
     * {@link module:engine/model/position~Position#isBefore is before} start position of all other ranges
     * (not to confuse with the first range added to the selection).
     *
     * Returns `null` if there are no ranges in selection.
     */
    getFirstRange(): Range | null;
    /**
     * Returns a copy of the last range in the selection.
     * Last range is the one which {@link module:engine/model/range~Range#end end} position
     * {@link module:engine/model/position~Position#isAfter is after} end position of all other ranges (not to confuse with the range most
     * recently added to the selection).
     *
     * Returns `null` if there are no ranges in selection.
     */
    getLastRange(): Range | null;
    /**
     * Gets elements of type {@link module:engine/model/schema~Schema#isBlock "block"} touched by the selection.
     *
     * This method's result can be used for example to apply block styling to all blocks covered by this selection.
     *
     * **Note:** `getSelectedBlocks()` returns blocks that are nested in other non-block elements
     * but will not return blocks nested in other blocks.
     *
     * In this case the function will return exactly all 3 paragraphs (note: `<blockQuote>` is not a block itself):
     *
     * ```
     * <paragraph>[a</paragraph>
     * <blockQuote>
     * 	<paragraph>b</paragraph>
     * </blockQuote>
     * <paragraph>c]d</paragraph>
     * ```
     *
     * In this case the paragraph will also be returned, despite the collapsed selection:
     *
     * ```
     * <paragraph>[]a</paragraph>
     * ```
     *
     * In such a scenario, however, only blocks A, B & E will be returned as blocks C & D are nested in block B:
     *
     * ```
     * [<blockA></blockA>
     * <blockB>
     * 	<blockC></blockC>
     * 	<blockD></blockD>
     * </blockB>
     * <blockE></blockE>]
     * ```
     *
     * If the selection is inside a block all the inner blocks (A & B) are returned:
     *
     * ```
     * <block>
     * 	<blockA>[a</blockA>
     * 	<blockB>b]</blockB>
     * </block>
     * ```
     *
     * **Special case**: If a selection ends at the beginning of a block, that block is not returned as from user perspective
     * this block wasn't selected. See [#984](https://github.com/ckeditor/ckeditor5-engine/issues/984) for more details.
     *
     * ```
     * <paragraph>[a</paragraph>
     * <paragraph>b</paragraph>
     * <paragraph>]c</paragraph> // this block will not be returned
     * ```
     */
    getSelectedBlocks(): IterableIterator<Element>;
    /**
     * Returns the selected element. {@link module:engine/model/element~Element Element} is considered as selected if there is only
     * one range in the selection, and that range contains exactly one element.
     * Returns `null` if there is no selected element.
     */
    getSelectedElement(): Element | null;
    /**
     * Checks whether the selection contains the entire content of the given element. This means that selection must start
     * at a position {@link module:engine/model/position~Position#isTouching touching} the element's start and ends at position
     * touching the element's end.
     *
     * By default, this method will check whether the entire content of the selection's current root is selected.
     * Useful to check if e.g. the user has just pressed <kbd>Ctrl</kbd> + <kbd>A</kbd>.
     */
    containsEntireContent(element: Element): boolean;
    /**
     * Unbinds all events previously bound by document selection.
     */
    destroy(): void;
    /**
     * Returns iterable that iterates over this selection's attribute keys.
     */
    getAttributeKeys(): IterableIterator<string>;
    /**
     * Returns iterable that iterates over this selection's attributes.
     *
     * Attributes are returned as arrays containing two items. First one is attribute key and second is attribute value.
     * This format is accepted by native `Map` object and also can be passed in `Node` constructor.
     */
    getAttributes(): IterableIterator<[string, unknown]>;
    /**
     * Gets an attribute value for given key or `undefined` if that attribute is not set on the selection.
     *
     * @param key Key of attribute to look for.
     * @returns Attribute value or `undefined`.
     */
    getAttribute(key: string): unknown;
    /**
     * Checks if the selection has an attribute for given key.
     *
     * @param key Key of attribute to check.
     * @returns `true` if attribute with given key is set on selection, `false` otherwise.
     */
    hasAttribute(key: string): boolean;
    /**
     * Refreshes selection attributes and markers according to the current position in the model.
     */
    refresh(): void;
    /**
     * Registers a marker group prefix or a marker name to be collected in the
     * {@link ~DocumentSelection#markers selection markers collection}.
     *
     * See also {@link module:engine/model/markercollection~MarkerCollection#getMarkersGroup `MarkerCollection#getMarkersGroup()`}.
     *
     * @param prefixOrName The marker group prefix or marker name.
     */
    observeMarkers(prefixOrName: string): void;
    /**
     * Moves {@link module:engine/model/documentselection~DocumentSelection#focus} to the specified location.
     * Should be used only within the {@link module:engine/model/writer~Writer#setSelectionFocus} method.
     *
     * The location can be specified in the same form as
     * {@link module:engine/model/writer~Writer#createPositionAt writer.createPositionAt()} parameters.
     *
     * @see module:engine/model/writer~Writer#setSelectionFocus
     * @internal
     * @param offset Offset or one of the flags. Used only when
     * first parameter is a {@link module:engine/model/item~Item model item}.
     */
    _setFocus(itemOrPosition: Item | Position, offset?: PositionOffset): void;
    /**
     * Sets this selection's ranges and direction to the specified location based on the given
     * {@link module:engine/model/selection~Selectable selectable}.
     * Should be used only within the {@link module:engine/model/writer~Writer#setSelection} method.
     *
     * @see module:engine/model/writer~Writer#setSelection
     * @internal
     */
    _setTo(...args: Parameters<Selection['setTo']>): void;
    /**
     * Sets attribute on the selection. If attribute with the same key already is set, it's value is overwritten.
     * Should be used only within the {@link module:engine/model/writer~Writer#setSelectionAttribute} method.
     *
     * @see module:engine/model/writer~Writer#setSelectionAttribute
     * @internal
     * @param key Key of the attribute to set.
     * @param value Attribute value.
     */
    _setAttribute(key: string, value: unknown): void;
    /**
     * Removes an attribute with given key from the selection.
     * If the given attribute was set on the selection, fires the {@link module:engine/model/selection~Selection#event:change:range}
     * event with removed attribute key.
     * Should be used only within the {@link module:engine/model/writer~Writer#removeSelectionAttribute} method.
     *
     * @see module:engine/model/writer~Writer#removeSelectionAttribute
     * @internal
     * @param key Key of the attribute to remove.
     */
    _removeAttribute(key: string): void;
    /**
     * Returns an iterable that iterates through all selection attributes stored in current selection's parent.
     *
     * @internal
     */
    _getStoredAttributes(): Iterable<[string, unknown]>;
    /**
     * Temporarily changes the gravity of the selection from the left to the right.
     *
     * The gravity defines from which direction the selection inherits its attributes. If it's the default left
     * gravity, the selection (after being moved by the the user) inherits attributes from its left hand side.
     * This method allows to temporarily override this behavior by forcing the gravity to the right.
     *
     * It returns an unique identifier which is required to restore the gravity. It guarantees the symmetry
     * of the process.
     *
     * @see module:engine/model/writer~Writer#overrideSelectionGravity
     * @internal
     * @returns The unique id which allows restoring the gravity.
     */
    _overrideGravity(): string;
    /**
     * Restores the {@link ~DocumentSelection#_overrideGravity overridden gravity}.
     *
     * Restoring the gravity is only possible using the unique identifier returned by
     * {@link ~DocumentSelection#_overrideGravity}. Note that the gravity remains overridden as long as won't be restored
     * the same number of times it was overridden.
     *
     * @see module:engine/model/writer~Writer#restoreSelectionGravity
     * @internal
     * @param uid The unique id returned by {@link #_overrideGravity}.
     */
    _restoreGravity(uid: string): void;
    /**
     * Generates and returns an attribute key for selection attributes store, basing on original attribute key.
     *
     * @internal
     * @param key Attribute key to convert.
     * @returns Converted attribute key, applicable for selection store.
     */
    static _getStoreAttributeKey(key: string): string;
    /**
     * Checks whether the given attribute key is an attribute stored on an element.
     *
     * @internal
     */
    static _isStoreAttributeKey(key: string): boolean;
}
/**
 * Fired when selection range(s) changed.
 *
 * @eventName ~DocumentSelection#change:range
 * @param directChange In case of {@link module:engine/model/selection~Selection} class it is always set
 * to `true` which indicates that the selection change was caused by a direct use of selection's API.
 * The {@link module:engine/model/documentselection~DocumentSelection}, however, may change because its position
 * was directly changed through the {@link module:engine/model/writer~Writer writer} or because its position was
 * changed because the structure of the model has been changed (which means an indirect change).
 * The indirect change does not occur in case of normal (detached) selections because they are "static" (as "not live")
 * which mean that they are not updated once the document changes.
 */
export type DocumentSelectionChangeRangeEvent = SelectionChangeRangeEvent;
/**
 * Fired when selection attribute changed.
 *
 * @eventName ~DocumentSelection#change:attribute
 * @param directChange In case of {@link module:engine/model/selection~Selection} class it is always set
 * to `true` which indicates that the selection change was caused by a direct use of selection's API.
 * The {@link module:engine/model/documentselection~DocumentSelection}, however, may change because its attributes
 * were directly changed through the {@link module:engine/model/writer~Writer writer} or because its position was
 * changed in the model and its attributes were refreshed (which means an indirect change).
 * The indirect change does not occur in case of normal (detached) selections because they are "static" (as "not live")
 * which mean that they are not updated once the document changes.
 * @param attributeKeys Array containing keys of attributes that changed.
*/
export type DocumentSelectionChangeAttributeEvent = SelectionChangeAttributeEvent;
/**
 * Fired when selection marker(s) changed.
 *
 * @eventName ~DocumentSelection#change:marker
 * @param directChange This is always set to `false` in case of `change:marker` event as there is no possibility
 * to change markers directly through {@link module:engine/model/documentselection~DocumentSelection} API.
 * See also {@link module:engine/model/documentselection~DocumentSelection#event:change:range} and
 * {@link module:engine/model/documentselection~DocumentSelection#event:change:attribute}.
 * @param oldMarkers Markers in which the selection was before the change.
 */
export type DocumentSelectionChangeMarkerEvent = {
    name: 'change:marker';
    args: [
        {
            directChange: boolean;
            oldMarkers: Array<Marker>;
        }
    ];
};
/**
 * Fired when selection range(s), attribute(s) or marker(s) changed.
 *
 * @eventName ~DocumentSelection#change
 * @param directChange This is always set to `false` in case of `change:marker` event as there is no possibility
 * to change markers directly through {@link module:engine/model/documentselection~DocumentSelection} API.
 * See also {@link module:engine/model/documentselection~DocumentSelection#event:change:range} and
 * {@link module:engine/model/documentselection~DocumentSelection#event:change:attribute}.
 * @param attributeKeys Array containing keys of attributes that changed.
 * @param oldMarkers Markers in which the selection was before the change.
 */
export type DocumentSelectionChangeEvent = {
    name: 'change' | 'change:attribute' | 'change:marker' | 'change:range';
    args: [
        {
            directChange: boolean;
            attributeKeys?: Array<string>;
            oldMarkers?: Array<Marker>;
        }
    ];
};
export {};
