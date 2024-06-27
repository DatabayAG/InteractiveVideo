/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/selection
 */
import TypeCheckable from './typecheckable.js';
import Range from './range.js';
import Position, { type PositionOffset } from './position.js';
import Node from './node.js';
import DocumentSelection from './documentselection.js';
import type Element from './element.js';
import type Item from './item.js';
import type EditableElement from './editableelement.js';
declare const Selection_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof TypeCheckable, import("@ckeditor/ckeditor5-utils").Emitter>;
/**
 * Class representing an arbirtary selection in the view.
 * See also {@link module:engine/view/documentselection~DocumentSelection}.
 *
 * New selection instances can be created via the constructor or one these methods:
 *
 * * {@link module:engine/view/view~View#createSelection `View#createSelection()`},
 * * {@link module:engine/view/upcastwriter~UpcastWriter#createSelection `UpcastWriter#createSelection()`}.
 *
 * A selection can consist of {@link module:engine/view/range~Range ranges} that can be set by using
 * the {@link module:engine/view/selection~Selection#setTo `Selection#setTo()`} method.
 */
export default class Selection extends /* #__PURE__ */ Selection_base {
    /**
     * Stores all ranges that are selected.
     */
    private _ranges;
    /**
     * Specifies whether the last added range was added as a backward or forward range.
     */
    private _lastRangeBackward;
    /**
     * Specifies whether selection instance is fake.
     */
    private _isFake;
    /**
     * Fake selection's label.
     */
    private _fakeSelectionLabel;
    /**
     * Creates new selection instance.
     *
     * **Note**: The selection constructor is available as a factory method:
     *
     * * {@link module:engine/view/view~View#createSelection `View#createSelection()`},
     * * {@link module:engine/view/upcastwriter~UpcastWriter#createSelection `UpcastWriter#createSelection()`}.
     *
     * ```ts
     * // Creates empty selection without ranges.
     * const selection = writer.createSelection();
     *
     * // Creates selection at the given range.
     * const range = writer.createRange( start, end );
     * const selection = writer.createSelection( range );
     *
     * // Creates selection at the given ranges
     * const ranges = [ writer.createRange( start1, end2 ), writer.createRange( star2, end2 ) ];
     * const selection = writer.createSelection( ranges );
     *
     * // Creates selection from the other selection.
     * const otherSelection = writer.createSelection();
     * const selection = writer.createSelection( otherSelection );
     *
     * // Creates selection from the document selection.
     * const selection = writer.createSelection( editor.editing.view.document.selection );
     *
     * // Creates selection at the given position.
     * const position = writer.createPositionFromPath( root, path );
     * const selection = writer.createSelection( position );
     *
     * // Creates collapsed selection at the position of given item and offset.
     * const paragraph = writer.createContainerElement( 'paragraph' );
     * const selection = writer.createSelection( paragraph, offset );
     *
     * // Creates a range inside an {@link module:engine/view/element~Element element} which starts before the
     * // first child of that element and ends after the last child of that element.
     * const selection = writer.createSelection( paragraph, 'in' );
     *
     * // Creates a range on an {@link module:engine/view/item~Item item} which starts before the item and ends
     * // just after the item.
     * const selection = writer.createSelection( paragraph, 'on' );
     * ```
     *
     * `Selection`'s constructor allow passing additional options (`backward`, `fake` and `label`) as the last argument.
     *
     * ```ts
     * // Creates backward selection.
     * const selection = writer.createSelection( range, { backward: true } );
     * ```
     *
     * Fake selection does not render as browser native selection over selected elements and is hidden to the user.
     * This way, no native selection UI artifacts are displayed to the user and selection over elements can be
     * represented in other way, for example by applying proper CSS class.
     *
     * Additionally fake's selection label can be provided. It will be used to describe fake selection in DOM
     * (and be  properly handled by screen readers).
     *
     * ```ts
     * // Creates fake selection with label.
     * const selection = writer.createSelection( range, { fake: true, label: 'foo' } );
     * ```
     *
     * @internal
     */
    constructor(...args: [] | [
        selectable: Node,
        placeOrOffset: PlaceOrOffset,
        options?: SelectionOptions
    ] | [
        selectable?: Exclude<Selectable, Node>,
        options?: SelectionOptions
    ]);
    /**
     * Returns true if selection instance is marked as `fake`.
     *
     * @see #setTo
     */
    get isFake(): boolean;
    /**
     * Returns fake selection label.
     *
     * @see #setTo
     */
    get fakeSelectionLabel(): string;
    /**
     * Selection anchor. Anchor may be described as a position where the selection starts. Together with
     * {@link #focus focus} they define the direction of selection, which is important
     * when expanding/shrinking selection. Anchor is always the start or end of the most recent added range.
     * It may be a bit unintuitive when there are multiple ranges in selection.
     *
     * @see #focus
     */
    get anchor(): Position | null;
    /**
     * Selection focus. Focus is a position where the selection ends.
     *
     * @see #anchor
     */
    get focus(): Position | null;
    /**
     * Returns whether the selection is collapsed. Selection is collapsed when there is exactly one range which is
     * collapsed.
     */
    get isCollapsed(): boolean;
    /**
     * Returns number of ranges in selection.
     */
    get rangeCount(): number;
    /**
     * Specifies whether the {@link #focus} precedes {@link #anchor}.
     */
    get isBackward(): boolean;
    /**
     * {@link module:engine/view/editableelement~EditableElement EditableElement} instance that contains this selection, or `null`
     * if the selection is not inside an editable element.
     */
    get editableElement(): EditableElement | null;
    /**
     * Returns an iterable that contains copies of all ranges added to the selection.
     */
    getRanges(): IterableIterator<Range>;
    /**
     * Returns copy of the first range in the selection. First range is the one which
     * {@link module:engine/view/range~Range#start start} position {@link module:engine/view/position~Position#isBefore is before} start
     * position of all other ranges (not to confuse with the first range added to the selection).
     * Returns `null` if no ranges are added to selection.
     */
    getFirstRange(): Range | null;
    /**
     * Returns copy of the last range in the selection. Last range is the one which {@link module:engine/view/range~Range#end end}
     * position {@link module:engine/view/position~Position#isAfter is after} end position of all other ranges (not to confuse
     * with the last range added to the selection). Returns `null` if no ranges are added to selection.
     */
    getLastRange(): Range | null;
    /**
     * Returns copy of the first position in the selection. First position is the position that
     * {@link module:engine/view/position~Position#isBefore is before} any other position in the selection ranges.
     * Returns `null` if no ranges are added to selection.
     */
    getFirstPosition(): Position | null;
    /**
     * Returns copy of the last position in the selection. Last position is the position that
     * {@link module:engine/view/position~Position#isAfter is after} any other position in the selection ranges.
     * Returns `null` if no ranges are added to selection.
     */
    getLastPosition(): Position | null;
    /**
     * Checks whether, this selection is equal to given selection. Selections are equal if they have same directions,
     * same number of ranges and all ranges from one selection equal to a range from other selection.
     *
     * @param otherSelection Selection to compare with.
     * @returns `true` if selections are equal, `false` otherwise.
     */
    isEqual(otherSelection: Selection | DocumentSelection): boolean;
    /**
     * Checks whether this selection is similar to given selection. Selections are similar if they have same directions, same
     * number of ranges, and all {@link module:engine/view/range~Range#getTrimmed trimmed} ranges from one selection are
     * equal to any trimmed range from other selection.
     *
     * @param otherSelection Selection to compare with.
     * @returns `true` if selections are similar, `false` otherwise.
     */
    isSimilar(otherSelection: Selection | DocumentSelection): boolean;
    /**
     * Returns the selected element. {@link module:engine/view/element~Element Element} is considered as selected if there is only
     * one range in the selection, and that range contains exactly one element.
     * Returns `null` if there is no selected element.
     */
    getSelectedElement(): Element | null;
    /**
     * Sets this selection's ranges and direction to the specified location based on the given
     * {@link module:engine/view/selection~Selectable selectable}.
     *
     * ```ts
     * // Sets selection to the given range.
     * const range = writer.createRange( start, end );
     * selection.setTo( range );
     *
     * // Sets selection to given ranges.
     * const ranges = [ writer.createRange( start1, end2 ), writer.createRange( star2, end2 ) ];
     * selection.setTo( range );
     *
     * // Sets selection to the other selection.
     * const otherSelection = writer.createSelection();
     * selection.setTo( otherSelection );
     *
     * // Sets selection to contents of DocumentSelection.
     * selection.setTo( editor.editing.view.document.selection );
     *
     * // Sets collapsed selection at the given position.
     * const position = writer.createPositionAt( root, path );
     * selection.setTo( position );
     *
     * // Sets collapsed selection at the position of given item and offset.
     * selection.setTo( paragraph, offset );
     * ```
     *
     * Creates a range inside an {@link module:engine/view/element~Element element} which starts before the first child of
     * that element and ends after the last child of that element.
     *
     * ```ts
     * selection.setTo( paragraph, 'in' );
     * ```
     *
     * Creates a range on an {@link module:engine/view/item~Item item} which starts before the item and ends just after the item.
     *
     * ```ts
     * selection.setTo( paragraph, 'on' );
     *
     * // Clears selection. Removes all ranges.
     * selection.setTo( null );
     * ```
     *
     * `Selection#setTo()` method allow passing additional options (`backward`, `fake` and `label`) as the last argument.
     *
     * ```ts
     * // Sets selection as backward.
     * selection.setTo( range, { backward: true } );
     * ```
     *
     * Fake selection does not render as browser native selection over selected elements and is hidden to the user.
     * This way, no native selection UI artifacts are displayed to the user and selection over elements can be
     * represented in other way, for example by applying proper CSS class.
     *
     * Additionally fake's selection label can be provided. It will be used to describe fake selection in DOM
     * (and be  properly handled by screen readers).
     *
     * ```ts
     * // Creates fake selection with label.
     * selection.setTo( range, { fake: true, label: 'foo' } );
     * ```
     *
     * @fires change
     */
    setTo(...args: [
        selectable: Node,
        placeOrOffset: PlaceOrOffset,
        options?: SelectionOptions
    ] | [
        selectable?: Exclude<Selectable, Node>,
        options?: SelectionOptions
    ]): void;
    /**
     * Moves {@link #focus} to the specified location.
     *
     * The location can be specified in the same form as {@link module:engine/view/view~View#createPositionAt view.createPositionAt()}
     * parameters.
     *
     * @fires change
     * @param offset Offset or one of the flags. Used only when first parameter is a {@link module:engine/view/item~Item view item}.
     */
    setFocus(itemOrPosition: Item | Position, offset?: PositionOffset): void;
    /**
     * Replaces all ranges that were added to the selection with given array of ranges. Last range of the array
     * is treated like the last added range and is used to set {@link #anchor anchor} and {@link #focus focus}.
     * Accepts a flag describing in which way the selection is made.
     *
     * @param newRanges Iterable object of ranges to set.
     * @param isLastBackward Flag describing if last added range was selected forward - from start to end
     * (`false`) or backward - from end to start (`true`). Defaults to `false`.
     */
    private _setRanges;
    /**
     * Sets this selection instance to be marked as `fake`. A fake selection does not render as browser native selection
     * over selected elements and is hidden to the user. This way, no native selection UI artifacts are displayed to
     * the user and selection over elements can be represented in other way, for example by applying proper CSS class.
     *
     * Additionally fake's selection label can be provided. It will be used to describe fake selection in DOM (and be
     * properly handled by screen readers).
     */
    private _setFakeOptions;
    /**
     * Adds a range to the selection. Added range is copied. This means that passed range is not saved in the
     * selection instance and you can safely operate on it.
     *
     * Accepts a flag describing in which way the selection is made - passed range might be selected from
     * {@link module:engine/view/range~Range#start start} to {@link module:engine/view/range~Range#end end}
     * or from {@link module:engine/view/range~Range#end end} to {@link module:engine/view/range~Range#start start}.
     * The flag is used to set {@link #anchor anchor} and {@link #focus focus} properties.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-selection-range-intersects` if added range intersects
     * with ranges already stored in Selection instance.
     */
    private _addRange;
    /**
     * Adds range to selection - creates copy of given range so it can be safely used and modified.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-selection-range-intersects` if added range intersects
     * with ranges already stored in selection instance.
     */
    private _pushRange;
}
/**
 * Additional options for {@link ~Selection}.
 */
export interface SelectionOptions {
    /**
     * Sets this selection instance to be backward.
     */
    backward?: boolean;
    /**
     * Sets this selection instance to be marked as `fake`.
     */
    fake?: boolean;
    /**
     * Label for the fake selection.
     */
    label?: string;
}
/**
 * The place or offset of the selection.
 */
export type PlaceOrOffset = number | 'before' | 'end' | 'after' | 'on' | 'in';
/**
 * Fired whenever selection ranges are changed through {@link ~Selection Selection API}.
 *
 * @eventName ~Selection#change
 */
export type ViewSelectionChangeEvent = {
    name: 'change';
    args: [];
};
/**
 * An entity that is used to set selection.
 *
 * See also {@link module:engine/view/selection~Selection#setTo}
 */
export type Selectable = Selection | DocumentSelection | Position | Iterable<Range> | Range | Node | null;
export {};
