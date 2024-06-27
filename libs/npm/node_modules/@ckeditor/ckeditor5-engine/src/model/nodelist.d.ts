/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/nodelist
 */
import Node from './node.js';
/**
 * Provides an interface to operate on a list of {@link module:engine/model/node~Node nodes}. `NodeList` is used internally
 * in classes like {@link module:engine/model/element~Element Element}
 * or {@link module:engine/model/documentfragment~DocumentFragment DocumentFragment}.
 */
export default class NodeList implements Iterable<Node> {
    /**
     * Nodes contained in this node list.
     */
    private _nodes;
    /**
     * Creates an empty node list.
     *
     * @internal
     * @param nodes Nodes contained in this node list.
     */
    constructor(nodes?: Iterable<Node>);
    /**
     * Iterable interface.
     *
     * Iterates over all nodes contained inside this node list.
     */
    [Symbol.iterator](): IterableIterator<Node>;
    /**
     * Number of nodes contained inside this node list.
     */
    get length(): number;
    /**
     * Sum of {@link module:engine/model/node~Node#offsetSize offset sizes} of all nodes contained inside this node list.
     */
    get maxOffset(): number;
    /**
     * Gets the node at the given index. Returns `null` if incorrect index was passed.
     */
    getNode(index: number): Node | null;
    /**
     * Returns an index of the given node. Returns `null` if given node is not inside this node list.
     */
    getNodeIndex(node: Node): number | null;
    /**
     * Returns the starting offset of given node. Starting offset is equal to the sum of
     * {@link module:engine/model/node~Node#offsetSize offset sizes} of all nodes that are before this node in this node list.
     */
    getNodeStartOffset(node: Node): number | null;
    /**
     * Converts index to offset in node list.
     *
     * Returns starting offset of a node that is at given index. Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError}
     * `model-nodelist-index-out-of-bounds` if given index is less than `0` or more than {@link #length}.
     */
    indexToOffset(index: number): number;
    /**
     * Converts offset in node list to index.
     *
     * Returns index of a node that occupies given offset. Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError}
     * `model-nodelist-offset-out-of-bounds` if given offset is less than `0` or more than {@link #maxOffset}.
     */
    offsetToIndex(offset: number): number;
    /**
     * Inserts given nodes at given index.
     *
     * @internal
     * @param index Index at which nodes should be inserted.
     * @param nodes Nodes to be inserted.
     */
    _insertNodes(index: number, nodes: Iterable<Node>): void;
    /**
     * Removes one or more nodes starting at the given index.
     *
     * @internal
     * @param indexStart Index of the first node to remove.
     * @param howMany Number of nodes to remove.
     * @returns Array containing removed nodes.
     */
    _removeNodes(indexStart: number, howMany?: number): Array<Node>;
    /**
     * Converts `NodeList` instance to an array containing nodes that were inserted in the node list. Nodes
     * are also converted to their plain object representation.
     *
     * @returns `NodeList` instance converted to `Array`.
     */
    toJSON(): unknown;
}
