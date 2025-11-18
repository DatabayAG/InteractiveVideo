/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/node
 */
import TypeCheckable from './typecheckable.js';
import type { default as Document, ChangeType } from './document.js';
import type DocumentFragment from './documentfragment.js';
import type Element from './element.js';
declare const Node_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof TypeCheckable, import("@ckeditor/ckeditor5-utils").Emitter>;
/**
 * Abstract view node class.
 *
 * This is an abstract class. Its constructor should not be used directly.
 * Use the {@link module:engine/view/downcastwriter~DowncastWriter} or {@link module:engine/view/upcastwriter~UpcastWriter}
 * to create new instances of view nodes.
 */
export default abstract class Node extends /* #__PURE__ */ Node_base {
    /**
     * The document instance to which this node belongs.
     */
    readonly document: Document;
    /**
     * Parent element. Null by default. Set by {@link module:engine/view/element~Element#_insertChild}.
     */
    readonly parent: Element | DocumentFragment | null;
    /**
     * Creates a tree view node.
     *
     * @param document The document instance to which this node belongs.
     */
    protected constructor(document: Document);
    /**
     * Index of the node in the parent element or null if the node has no parent.
     *
     * Accessing this property throws an error if this node's parent element does not contain it.
     * This means that view tree got broken.
     */
    get index(): number | null;
    /**
     * Node's next sibling, or `null` if it is the last child.
     */
    get nextSibling(): Node | null;
    /**
     * Node's previous sibling, or `null` if it is the first child.
     */
    get previousSibling(): Node | null;
    /**
     * Top-most ancestor of the node. If the node has no parent it is the root itself.
     */
    get root(): Element | DocumentFragment;
    /**
     * Returns true if the node is in a tree rooted in the document (is a descendant of one of its roots).
     */
    isAttached(): boolean;
    /**
     * Gets a path to the node. The path is an array containing indices of consecutive ancestors of this node,
     * beginning from {@link module:engine/view/node~Node#root root}, down to this node's index.
     *
     * ```ts
     * const abc = downcastWriter.createText( 'abc' );
     * const foo = downcastWriter.createText( 'foo' );
     * const h1 = downcastWriter.createElement( 'h1', null, downcastWriter.createText( 'header' ) );
     * const p = downcastWriter.createElement( 'p', null, [ abc, foo ] );
     * const div = downcastWriter.createElement( 'div', null, [ h1, p ] );
     * foo.getPath(); // Returns [ 1, 3 ]. `foo` is in `p` which is in `div`. `p` starts at offset 1, while `foo` at 3.
     * h1.getPath(); // Returns [ 0 ].
     * div.getPath(); // Returns [].
     * ```
     *
     * @returns The path.
     */
    getPath(): Array<number>;
    /**
     * Returns ancestors array of this node.
     *
     * @param options Options object.
     * @param options.includeSelf When set to `true` this node will be also included in parent's array.
     * @param options.parentFirst When set to `true`, array will be sorted from node's parent to root element,
     * otherwise root element will be the first item in the array.
     * @returns Array with ancestors.
     */
    getAncestors(options?: {
        includeSelf?: boolean;
        parentFirst?: boolean;
    }): Array<Node | DocumentFragment>;
    /**
     * Returns a {@link module:engine/view/element~Element} or {@link module:engine/view/documentfragment~DocumentFragment}
     * which is a common ancestor of both nodes.
     *
     * @param node The second node.
     * @param options Options object.
     * @param options.includeSelf When set to `true` both nodes will be considered "ancestors" too.
     * Which means that if e.g. node A is inside B, then their common ancestor will be B.
     */
    getCommonAncestor(node: Node, options?: {
        includeSelf?: boolean;
    }): Element | DocumentFragment | null;
    /**
     * Returns whether this node is before given node. `false` is returned if nodes are in different trees (for example,
     * in different {@link module:engine/view/documentfragment~DocumentFragment}s).
     *
     * @param node Node to compare with.
     */
    isBefore(node: Node): boolean;
    /**
     * Returns whether this node is after given node. `false` is returned if nodes are in different trees (for example,
     * in different {@link module:engine/view/documentfragment~DocumentFragment}s).
     *
     * @param node Node to compare with.
     */
    isAfter(node: Node): boolean;
    /**
     * Removes node from parent.
     *
     * @internal
     */
    _remove(): void;
    /**
     * @internal
     * @param type Type of the change.
     * @param node Changed node.
     * @fires change
     */
    _fireChange(type: ChangeType, node: Node): void;
    /**
     * Custom toJSON method to solve child-parent circular dependencies.
     *
     * @returns Clone of this object with the parent property removed.
     */
    toJSON(): unknown;
    /**
     * Clones this node.
     *
     * @internal
     * @returns Clone of this node.
     */
    abstract _clone(deep?: boolean): Node;
    /**
     * Checks if provided node is similar to this node.
     *
     * @returns True if nodes are similar.
     */
    abstract isSimilar(other: Node): boolean;
}
/**
 * Fired when list of {@link module:engine/view/element~Element elements} children, attributes or data changes.
 *
 * Change event is bubbled – it is fired on all ancestors.
 *
 * @eventName ~Node#change
 * @eventName ~Node#change:children
 * @eventName ~Node#change:attributes
 * @eventName ~Node#change:text
 */
export type ViewNodeChangeEvent = {
    name: 'change' | `change:${ChangeType}`;
    args: [changedNode: Node];
};
export {};
