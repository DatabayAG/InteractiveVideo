/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/splitoperation
 */
import Operation from './operation.js';
import Position from '../position.js';
import Range from '../range.js';
import type Document from '../document.js';
import type { Selectable } from '../selection.js';
/**
 * Operation to split {@link module:engine/model/element~Element an element} at given
 * {@link module:engine/model/operation/splitoperation~SplitOperation#splitPosition split position} into two elements,
 * both containing a part of the element's original content.
 */
export default class SplitOperation extends Operation {
    /**
     * Position at which an element should be split.
     */
    splitPosition: Position;
    /**
     * Total offset size of elements that are in the split element after `position`.
     */
    howMany: number;
    /**
     * Position at which the clone of split element (or element from graveyard) will be inserted.
     */
    insertionPosition: Position;
    /**
     * Position in the graveyard root before the element which should be used as a parent of the nodes after `position`.
     * If it is not set, a copy of the the `position` parent will be used.
     *
     * The default behavior is to clone the split element. Element from graveyard is used during undo.
     */
    graveyardPosition: Position | null;
    /**
     * Creates a split operation.
     *
     * @param splitPosition Position at which an element should be split.
     * @param howMany Total offset size of elements that are in the split element after `position`.
     * @param insertionPosition Position at which the clone of split element (or element from graveyard) will be inserted.
     * @param graveyardPosition Position in the graveyard root before the element which
     * should be used as a parent of the nodes after `position`. If it is not set, a copy of the the `position` parent will be used.
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(splitPosition: Position, howMany: number, insertionPosition: Position, graveyardPosition: Position | null, baseVersion: number | null);
    /**
     * @inheritDoc
     */
    get type(): 'split';
    /**
     * Position inside the new clone of a split element.
     *
     * This is a position where nodes that are after the split position will be moved to.
     */
    get moveTargetPosition(): Position;
    /**
     * Artificial range that contains all the nodes from the split element that will be moved to the new element.
     * The range starts at {@link #splitPosition} and ends in the same parent, at `POSITIVE_INFINITY` offset.
     */
    get movedRange(): Range;
    /**
     * @inheritDoc
     */
    get affectedSelectable(): Selectable;
    /**
     * Creates and returns an operation that has the same parameters as this operation.
     *
     * @returns Clone of this operation.
     */
    clone(): SplitOperation;
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
     * Helper function that returns a default insertion position basing on given `splitPosition`. The default insertion
     * position is after the split element.
     */
    static getInsertionPosition(splitPosition: Position): Position;
    /**
     * Creates `SplitOperation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param document Document on which this operation will be applied.
     */
    static fromJSON(json: any, document: Document): SplitOperation;
}
