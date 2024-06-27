/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/moveoperation
 */
import Operation from './operation.js';
import Position from '../position.js';
import type { Selectable } from '../selection.js';
import type Document from '../document.js';
/**
 * Operation to move a range of {@link module:engine/model/item~Item model items}
 * to given {@link module:engine/model/position~Position target position}.
 */
export default class MoveOperation extends Operation {
    /**
     * Position before the first {@link module:engine/model/item~Item model item} to move.
     */
    sourcePosition: Position;
    /**
     * Offset size of moved range.
     */
    howMany: number;
    /**
     * Position at which moved nodes will be inserted.
     */
    targetPosition: Position;
    /**
     * Creates a move operation.
     *
     * @param sourcePosition Position before the first {@link module:engine/model/item~Item model item} to move.
     * @param howMany Offset size of moved range. Moved range will start from `sourcePosition` and end at
     * `sourcePosition` with offset shifted by `howMany`.
     * @param targetPosition Position at which moved nodes will be inserted.
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(sourcePosition: Position, howMany: number, targetPosition: Position, baseVersion: number | null);
    /**
     * @inheritDoc
     */
    get type(): 'move' | 'remove' | 'reinsert';
    /**
     * @inheritDoc
     */
    get affectedSelectable(): Selectable;
    /**
     * Creates and returns an operation that has the same parameters as this operation.
     */
    clone(): MoveOperation;
    /**
     * Returns the start position of the moved range after it got moved. This may be different than
     * {@link module:engine/model/operation/moveoperation~MoveOperation#targetPosition} in some cases, i.e. when a range is moved
     * inside the same parent but {@link module:engine/model/operation/moveoperation~MoveOperation#targetPosition targetPosition}
     * is after {@link module:engine/model/operation/moveoperation~MoveOperation#sourcePosition sourcePosition}.
     *
     * ```
     *  vv              vv
     * abcdefg ===> adefbcg
     *      ^          ^
     *      targetPos  movedRangeStart
     *      offset 6   offset 4
     *```
     */
    getMovedRangeStart(): Position;
    /**
     * See {@link module:engine/model/operation/operation~Operation#getReversed `Operation#getReversed()`}.
     */
    getReversed(): Operation;
    /**
     * @inheritDoc
     * @internal
     */
    _validate(): void;
    /**
     * @inheritDoc
     * @internal
     */
    _execute(): void;
    /**
     * @inheritDoc
     */
    toJSON(): unknown;
    /**
     * @inheritDoc
     */
    static get className(): string;
    /**
     * Creates `MoveOperation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param document Document on which this operation will be applied.
     */
    static fromJSON(json: any, document: Document): MoveOperation;
}
