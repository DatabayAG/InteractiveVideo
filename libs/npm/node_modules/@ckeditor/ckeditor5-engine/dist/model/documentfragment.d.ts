/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/documentfragment
 */
import TypeCheckable from './typecheckable.js';
import type Item from './item.js';
import type Node from './node.js';
import type Range from './range.js';
/**
 * DocumentFragment represents a part of model which does not have a common root but its top-level nodes
 * can be seen as siblings. In other words, it is a detached part of model tree, without a root.
 *
 * DocumentFragment has own {@link module:engine/model/markercollection~MarkerCollection}. Markers from this collection
 * will be set to the {@link module:engine/model/model~Model#markers model markers} by a
 * {@link module:engine/model/writer~Writer#insert} function.
 */
export default class DocumentFragment extends TypeCheckable implements Iterable<Node> {
    /**
     * DocumentFragment static markers map. This is a list of names and {@link module:engine/model/range~Range ranges}
     * which will be set as Markers to {@link module:engine/model/model~Model#markers model markers collection}
     * when DocumentFragment will be inserted to the document.
     */
    readonly markers: Map<string, Range>;
    /**
     * Artificial element name. Returns `undefined`. Added for compatibility reasons.
     */
    name?: undefined;
    /**
     * Artificial root name. Returns `undefined`. Added for compatibility reasons.
     */
    rootName?: undefined;
    /**
     * List of nodes contained inside the document fragment.
     */
    private readonly _children;
    /**
     * Creates an empty `DocumentFragment`.
     *
     * **Note:** Constructor of this class shouldn't be used directly in the code.
     * Use the {@link module:engine/model/writer~Writer#createDocumentFragment} method instead.
     *
     * @internal
     * @param children Nodes to be contained inside the `DocumentFragment`.
     */
    constructor(children?: Node | Iterable<Node>);
    /**
     * Returns an iterator that iterates over all nodes contained inside this document fragment.
     */
    [Symbol.iterator](): IterableIterator<Node>;
    /**
     * Number of this document fragment's children.
     */
    get childCount(): number;
    /**
     * Sum of {@link module:engine/model/node~Node#offsetSize offset sizes} of all of this document fragment's children.
     */
    get maxOffset(): number;
    /**
     * Is `true` if there are no nodes inside this document fragment, `false` otherwise.
     */
    get isEmpty(): boolean;
    /**
     * Artificial next sibling. Returns `null`. Added for compatibility reasons.
     */
    get nextSibling(): null;
    /**
     * Artificial previous sibling. Returns `null`. Added for compatibility reasons.
     */
    get previousSibling(): null;
    /**
     * Artificial root of `DocumentFragment`. Returns itself. Added for compatibility reasons.
     */
    get root(): DocumentFragment;
    /**
     * Artificial parent of `DocumentFragment`. Returns `null`. Added for compatibility reasons.
     */
    get parent(): null;
    /**
     * Artificial owner of `DocumentFragment`. Returns `null`. Added for compatibility reasons.
     */
    get document(): null;
    /**
     * Returns `false` as `DocumentFragment` by definition is not attached to a document. Added for compatibility reasons.
     */
    isAttached(): false;
    /**
     * Returns empty array. Added for compatibility reasons.
     */
    getAncestors(): Array<never>;
    /**
     * Gets the child at the given index. Returns `null` if incorrect index was passed.
     *
     * @param index Index of child.
     * @returns Child node.
     */
    getChild(index: number): Node | null;
    /**
     * Returns an iterator that iterates over all of this document fragment's children.
     */
    getChildren(): IterableIterator<Node>;
    /**
     * Returns an index of the given child node. Returns `null` if given node is not a child of this document fragment.
     *
     * @param node Child node to look for.
     * @returns Child node's index.
     */
    getChildIndex(node: Node): number | null;
    /**
     * Returns the starting offset of given child. Starting offset is equal to the sum of
     * {@link module:engine/model/node~Node#offsetSize offset sizes} of all node's siblings that are before it. Returns `null` if
     * given node is not a child of this document fragment.
     *
     * @param node Child node to look for.
     * @returns Child node's starting offset.
     */
    getChildStartOffset(node: Node): number | null;
    /**
     * Returns path to a `DocumentFragment`, which is an empty array. Added for compatibility reasons.
     */
    getPath(): Array<number>;
    /**
     * Returns a descendant node by its path relative to this element.
     *
     * ```ts
     * // <this>a<b>c</b></this>
     * this.getNodeByPath( [ 0 ] );     // -> "a"
     * this.getNodeByPath( [ 1 ] );     // -> <b>
     * this.getNodeByPath( [ 1, 0 ] );  // -> "c"
     * ```
     *
     * @param relativePath Path of the node to find, relative to this element.
     */
    getNodeByPath(relativePath: Array<number>): Node | DocumentFragment;
    /**
     * Converts offset "position" to index "position".
     *
     * Returns index of a node that occupies given offset. If given offset is too low, returns `0`. If given offset is
     * too high, returns index after last child.
     *
     * ```ts
     * const textNode = new Text( 'foo' );
     * const pElement = new Element( 'p' );
     * const docFrag = new DocumentFragment( [ textNode, pElement ] );
     * docFrag.offsetToIndex( -1 ); // Returns 0, because offset is too low.
     * docFrag.offsetToIndex( 0 ); // Returns 0, because offset 0 is taken by `textNode` which is at index 0.
     * docFrag.offsetToIndex( 1 ); // Returns 0, because `textNode` has `offsetSize` equal to 3, so it occupies offset 1 too.
     * docFrag.offsetToIndex( 2 ); // Returns 0.
     * docFrag.offsetToIndex( 3 ); // Returns 1.
     * docFrag.offsetToIndex( 4 ); // Returns 2. There are no nodes at offset 4, so last available index is returned.
     * ```
     *
     * @param offset Offset to look for.
     * @returns Index of a node that occupies given offset.
     */
    offsetToIndex(offset: number): number;
    /**
     * Converts `DocumentFragment` instance to plain object and returns it.
     * Takes care of converting all of this document fragment's children.
     *
     * @returns `DocumentFragment` instance converted to plain object.
     */
    toJSON(): unknown;
    /**
     * Creates a `DocumentFragment` instance from given plain object (i.e. parsed JSON string).
     * Converts `DocumentFragment` children to proper nodes.
     *
     * @param json Plain object to be converted to `DocumentFragment`.
     * @returns `DocumentFragment` instance created using given plain object.
     */
    static fromJSON(json: any): DocumentFragment;
    /**
     * {@link #_insertChild Inserts} one or more nodes at the end of this document fragment.
     *
     * @internal
     * @param items Items to be inserted.
     */
    _appendChild(items: string | Item | Iterable<string | Item>): void;
    /**
     * Inserts one or more nodes at the given index and sets {@link module:engine/model/node~Node#parent parent} of these nodes
     * to this document fragment.
     *
     * @internal
     * @param index Index at which nodes should be inserted.
     * @param items Items to be inserted.
     */
    _insertChild(index: number, items: string | Item | Iterable<string | Item>): void;
    /**
     * Removes one or more nodes starting at the given index
     * and sets {@link module:engine/model/node~Node#parent parent} of these nodes to `null`.
     *
     * @internal
     * @param index Index of the first node to remove.
     * @param howMany Number of nodes to remove.
     * @returns Array containing removed nodes.
     */
    _removeChildren(index: number, howMany?: number): Array<Node>;
}
