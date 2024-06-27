/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/liveposition
 */
import Position, { type PositionOffset, type PositionStickiness } from './position.js';
import type DocumentFragment from './documentfragment.js';
import type Item from './item.js';
import type RootElement from './rootelement.js';
declare const LivePosition_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof Position, import("@ckeditor/ckeditor5-utils").Emitter>;
/**
 * `LivePosition` is a type of {@link module:engine/model/position~Position Position}
 * that updates itself as {@link module:engine/model/document~Document document}
 * is changed through operations. It may be used as a bookmark.
 *
 * **Note:** Contrary to {@link module:engine/model/position~Position}, `LivePosition` works only in roots that are
 * {@link module:engine/model/rootelement~RootElement}.
 * If {@link module:engine/model/documentfragment~DocumentFragment} is passed, error will be thrown.
 *
 * **Note:** Be very careful when dealing with `LivePosition`. Each `LivePosition` instance bind events that might
 * have to be unbound.
 * Use {@link module:engine/model/liveposition~LivePosition#detach} whenever you don't need `LivePosition` anymore.
 */
export default class LivePosition extends /* #__PURE__ */ LivePosition_base {
    /**
     * Root of the position path.
     */
    readonly root: RootElement;
    /**
     * Creates a live position.
     *
     * @see module:engine/model/position~Position
     */
    constructor(root: RootElement, path: Array<number>, stickiness?: PositionStickiness);
    /**
     * Unbinds all events previously bound by `LivePosition`. Use it whenever you don't need `LivePosition` instance
     * anymore (i.e. when leaving scope in which it was declared or before re-assigning variable that was
     * referring to it).
     */
    detach(): void;
    /**
     * Creates a {@link module:engine/model/position~Position position instance}, which is equal to this live position.
     */
    toPosition(): Position;
    /**
     * Creates a `LivePosition` instance that is equal to position.
     */
    static fromPosition(position: Position, stickiness?: PositionStickiness): LivePosition;
    /**
     * @internal
     * @see module:engine/model/position~Position._createAfter
     */
    static readonly _createAfter: (item: Item | DocumentFragment, stickiness?: PositionStickiness) => LivePosition;
    /**
     * @internal
     * @see module:engine/model/position~Position._createBefore
     */
    static readonly _createBefore: (item: Item | DocumentFragment, stickiness?: PositionStickiness) => LivePosition;
    /**
     * @internal
     * @see module:engine/model/position~Position._createAt
     */
    static readonly _createAt: (itemOrPosition: Item | Position | DocumentFragment, offset?: PositionOffset, stickiness?: PositionStickiness) => LivePosition;
}
/**
 * Fired when `LivePosition` instance is changed due to changes on {@link module:engine/model/document~Document}.
 *
 * @eventName ~LivePosition#change
 * @param oldPosition Position equal to this live position before it got changed.
 */
export type LivePositionChangeEvent = {
    name: 'change';
    args: [oldPosition: Position];
};
export {};
