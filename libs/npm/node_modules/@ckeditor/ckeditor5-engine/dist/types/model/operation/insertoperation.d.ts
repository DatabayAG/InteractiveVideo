/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/insertoperation
 */
import Operation from './operation.js';
import Position from '../position.js';
import NodeList from '../nodelist.js';
import { type NodeSet } from './utils.js';
import type { Selectable } from '../selection.js';
import type Document from '../document.js';
/**
 * Operation to insert one or more nodes at given position in the model.
 */
export default class InsertOperation extends Operation {
    /**
     * Position of insertion.
     *
     * @readonly
     */
    position: Position;
    /**
     * List of nodes to insert.
     *
     * @readonly
     */
    nodes: NodeList;
    /**
     * Flag deciding how the operation should be transformed. If set to `true`, nodes might get additional attributes
     * during operational transformation. This happens when the operation insertion position is inside of a range
     * where attributes have changed.
     */
    shouldReceiveAttributes: boolean;
    /**
     * Creates an insert operation.
     *
     * @param position Position of insertion.
     * @param nodes The list of nodes to be inserted.
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(position: Position, nodes: NodeSet, baseVersion: number | null);
    /**
     * @inheritDoc
     */
    get type(): 'insert';
    /**
     * Total offset size of inserted nodes.
     */
    get howMany(): number;
    /**
     * @inheritDoc
     */
    get affectedSelectable(): Selectable;
    /**
     * Creates and returns an operation that has the same parameters as this operation.
     */
    clone(): InsertOperation;
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
     * Creates `InsertOperation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param document Document on which this operation will be applied.
     */
    static fromJSON(json: any, document: Document): InsertOperation;
}
