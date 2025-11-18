/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/liverange
 */
import Range from './range.js';
import type DocumentFragment from './documentfragment.js';
import type Element from './element.js';
import type Item from './item.js';
import type Position from './position.js';
declare const LiveRange_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof Range, import("@ckeditor/ckeditor5-utils").Emitter>;
/**
 * `LiveRange` is a type of {@link module:engine/model/range~Range Range}
 * that updates itself as {@link module:engine/model/document~Document document}
 * is changed through operations. It may be used as a bookmark.
 *
 * **Note:** Be very careful when dealing with `LiveRange`. Each `LiveRange` instance bind events that might
 * have to be unbound. Use {@link module:engine/model/liverange~LiveRange#detach detach} whenever you don't need `LiveRange` anymore.
 */
export default class LiveRange extends /* #__PURE__ */ LiveRange_base {
    /**
     * Creates a live range.
     *
     * @see module:engine/model/range~Range
     */
    constructor(start: Position, end?: Position | null);
    /**
     * Unbinds all events previously bound by `LiveRange`. Use it whenever you don't need `LiveRange` instance
     * anymore (i.e. when leaving scope in which it was declared or before re-assigning variable that was
     * referring to it).
     */
    detach(): void;
    /**
     * Creates a {@link module:engine/model/range~Range range instance} that is equal to this live range.
     */
    toRange(): Range;
    /**
     * Creates a `LiveRange` instance that is equal to the given range.
     */
    static fromRange(range: Range): LiveRange;
    /**
     * @see module:engine/model/range~Range._createIn
     * @internal
     */
    static readonly _createIn: (element: Element | DocumentFragment) => LiveRange;
    /**
     * @see module:engine/model/range~Range._createOn
     * @internal
     */
    static readonly _createOn: (element: Item | DocumentFragment) => LiveRange;
    /**
     * @see module:engine/model/range~Range._createFromPositionAndShift
     * @internal
     */
    static readonly _createFromPositionAndShift: (position: Position, shift: number) => LiveRange;
}
/**
 * Fired when `LiveRange` instance boundaries have changed due to changes in the
 * {@link module:engine/model/document~Document document}.
 *
 * @eventName ~LiveRange#change:range
 * @param oldRange Range with start and end position equal to start and end position of this live
 * range before it got changed.
 * @param data Object with additional information about the change.
 * @param data.deletionPosition Source position for remove and merge changes.
 * Available if the range was moved to the graveyard root, `null` otherwise.
 */
export type LiveRangeChangeRangeEvent = {
    name: 'change' | 'change:range';
    args: [range: Range, data: {
        deletionPosition: Position | null;
    }];
};
/**
 * Fired when `LiveRange` instance boundaries have not changed after a change in {@link module:engine/model/document~Document document}
 * but the change took place inside the range, effectively changing its content.
 *
 * @eventName ~LiveRange#change:content
 * @param range Range with start and end position equal to start and end position of
 * change range.
 * @param data Object with additional information about the change.
 * @param data.deletionPosition Due to the nature of this event, this property is always set to `null`. It is passed
 * for compatibility with the {@link module:engine/model/liverange~LiveRange#event:change:range} event.
 */
export type LiveRangeChangeContentEvent = {
    name: 'change' | 'change:content';
    args: [range: Range, data: {
        deletionPosition: null;
    }];
};
/**
 * Describes `change:range` or `change:content` event.
 */
export type LiveRangeChangeEvent = {
    name: 'change' | 'change:range' | 'change:content';
    args: [range: Range, data: {
        deletionPosition: Position | null;
    }];
};
export {};
