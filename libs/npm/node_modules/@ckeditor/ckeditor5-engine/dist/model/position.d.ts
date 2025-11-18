/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/position
 */
import TypeCheckable from './typecheckable.js';
import { type TreeWalkerOptions, type TreeWalkerValue } from './treewalker.js';
import type Document from './document.js';
import type DocumentFragment from './documentfragment.js';
import type Element from './element.js';
import type InsertOperation from './operation/insertoperation.js';
import type Item from './item.js';
import type MergeOperation from './operation/mergeoperation.js';
import type MoveOperation from './operation/moveoperation.js';
import type Node from './node.js';
import type Operation from './operation/operation.js';
import type SplitOperation from './operation/splitoperation.js';
import type Text from './text.js';
/**
 * Represents a position in the model tree.
 *
 * A position is represented by its {@link module:engine/model/position~Position#root} and
 * a {@link module:engine/model/position~Position#path} in that root.
 *
 * You can create position instances via its constructor or the `createPosition*()` factory methods of
 * {@link module:engine/model/model~Model} and {@link module:engine/model/writer~Writer}.
 *
 * **Note:** Position is based on offsets, not indexes. This means that a position between two text nodes
 * `foo` and `bar` has offset `3`, not `1`. See {@link module:engine/model/position~Position#path} for more information.
 *
 * Since a position in the model is represented by a {@link module:engine/model/position~Position#root position root} and
 * {@link module:engine/model/position~Position#path position path} it is possible to create positions placed in non-existing places.
 * This requirement is important for operational transformation algorithms.
 *
 * Also, {@link module:engine/model/operation/operation~Operation operations}
 * kept in the {@link module:engine/model/document~Document#history document history}
 * are storing positions (and ranges) which were correct when those operations were applied, but may not be correct
 * after the document has changed.
 *
 * When changes are applied to the model, it may also happen that {@link module:engine/model/position~Position#parent position parent}
 * will change even if position path has not changed. Keep in mind, that if a position leads to non-existing element,
 * {@link module:engine/model/position~Position#parent} and some other properties and methods will throw errors.
 *
 * In most cases, position with wrong path is caused by an error in code, but it is sometimes needed, as described above.
 */
export default class Position extends TypeCheckable {
    /**
     * Root of the position path.
     */
    readonly root: Element | DocumentFragment;
    /**
     * Position of the node in the tree. **Path contains offsets, not indexes.**
     *
     * Position can be placed before, after or in a {@link module:engine/model/node~Node node} if that node has
     * {@link module:engine/model/node~Node#offsetSize} greater than `1`. Items in position path are
     * {@link module:engine/model/node~Node#startOffset starting offsets} of position ancestors, starting from direct root children,
     * down to the position offset in it's parent.
     *
     * ```
     * ROOT
     *  |- P            before: [ 0 ]         after: [ 1 ]
     *  |- UL           before: [ 1 ]         after: [ 2 ]
     *     |- LI        before: [ 1, 0 ]      after: [ 1, 1 ]
     *     |  |- foo    before: [ 1, 0, 0 ]   after: [ 1, 0, 3 ]
     *     |- LI        before: [ 1, 1 ]      after: [ 1, 2 ]
     *        |- bar    before: [ 1, 1, 0 ]   after: [ 1, 1, 3 ]
     * ```
     *
     * `foo` and `bar` are representing {@link module:engine/model/text~Text text nodes}. Since text nodes has offset size
     * greater than `1` you can place position offset between their start and end:
     *
     * ```
     * ROOT
     *  |- P
     *  |- UL
     *     |- LI
     *     |  |- f^o|o  ^ has path: [ 1, 0, 1 ]   | has path: [ 1, 0, 2 ]
     *     |- LI
     *        |- b^a|r  ^ has path: [ 1, 1, 1 ]   | has path: [ 1, 1, 2 ]
     * ```
     */
    readonly path: ReadonlyArray<number>;
    /**
     * Position stickiness. See {@link module:engine/model/position~PositionStickiness}.
     */
    stickiness: PositionStickiness;
    /**
     * Creates a position.
     *
     * @param root Root of the position.
     * @param path Position path. See {@link module:engine/model/position~Position#path}.
     * @param stickiness Position stickiness. See {@link module:engine/model/position~PositionStickiness}.
     */
    constructor(root: Element | DocumentFragment, path: ReadonlyArray<number>, stickiness?: PositionStickiness);
    /**
     * Offset at which this position is located in its {@link module:engine/model/position~Position#parent parent}. It is equal
     * to the last item in position {@link module:engine/model/position~Position#path path}.
     *
     * @type {Number}
     */
    get offset(): number;
    set offset(newOffset: number);
    /**
     * Parent element of this position.
     *
     * Keep in mind that `parent` value is calculated when the property is accessed.
     * If {@link module:engine/model/position~Position#path position path}
     * leads to a non-existing element, `parent` property will throw error.
     *
     * Also it is a good idea to cache `parent` property if it is used frequently in an algorithm (i.e. in a long loop).
     */
    get parent(): Element | DocumentFragment;
    /**
     * Position {@link module:engine/model/position~Position#offset offset} converted to an index in position's parent node. It is
     * equal to the {@link module:engine/model/node~Node#index index} of a node after this position. If position is placed
     * in text node, position index is equal to the index of that text node.
     */
    get index(): number;
    /**
     * Returns {@link module:engine/model/text~Text text node} instance in which this position is placed or `null` if this
     * position is not in a text node.
     */
    get textNode(): Text | null;
    /**
     * Node directly after this position or `null` if this position is in text node.
     */
    get nodeAfter(): Node | null;
    /**
     * Node directly before this position or `null` if this position is in text node.
     */
    get nodeBefore(): Node | null;
    /**
     * Is `true` if position is at the beginning of its {@link module:engine/model/position~Position#parent parent}, `false` otherwise.
     */
    get isAtStart(): boolean;
    /**
     * Is `true` if position is at the end of its {@link module:engine/model/position~Position#parent parent}, `false` otherwise.
     */
    get isAtEnd(): boolean;
    /**
     * Checks whether this position is before or after given position.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     */
    compareWith(otherPosition: Position): PositionRelation;
    /**
     * Gets the farthest position which matches the callback using
     * {@link module:engine/model/treewalker~TreeWalker TreeWalker}.
     *
     * For example:
     *
     * ```ts
     * getLastMatchingPosition( value => value.type == 'text' );
     * // <paragraph>[]foo</paragraph> -> <paragraph>foo[]</paragraph>
     *
     * getLastMatchingPosition( value => value.type == 'text', { direction: 'backward' } );
     * // <paragraph>foo[]</paragraph> -> <paragraph>[]foo</paragraph>
     *
     * getLastMatchingPosition( value => false );
     * // Do not move the position.
     * ```
     *
     * @param skip Callback function. Gets {@link module:engine/model/treewalker~TreeWalkerValue} and should
     * return `true` if the value should be skipped or `false` if not.
     * @param options Object with configuration options. See {@link module:engine/model/treewalker~TreeWalker}.
     *
     * @returns The position after the last item which matches the `skip` callback test.
     */
    getLastMatchingPosition(skip: (value: TreeWalkerValue) => boolean, options?: TreeWalkerOptions): Position;
    /**
     * Returns a path to this position's parent. Parent path is equal to position {@link module:engine/model/position~Position#path path}
     * but without the last item.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @returns Path to the parent.
     */
    getParentPath(): Array<number>;
    /**
     * Returns ancestors array of this position, that is this position's parent and its ancestors.
     *
     * @returns Array with ancestors.
     */
    getAncestors(): Array<Element | DocumentFragment>;
    /**
     * Returns the parent element of the given name. Returns null if the position is not inside the desired parent.
     *
     * @param parentName The name of the parent element to find.
     */
    findAncestor(parentName: string): Element | null;
    /**
     * Returns the slice of two position {@link #path paths} which is identical. The {@link #root roots}
     * of these two paths must be identical.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param position The second position.
     * @returns The common path.
     */
    getCommonPath(position: Position): Array<number>;
    /**
     * Returns an {@link module:engine/model/element~Element} or {@link module:engine/model/documentfragment~DocumentFragment}
     * which is a common ancestor of both positions. The {@link #root roots} of these two positions must be identical.
     *
     * @param position The second position.
     */
    getCommonAncestor(position: Position): Element | DocumentFragment | null;
    /**
     * Returns a new instance of `Position`, that has same {@link #parent parent} but it's offset
     * is shifted by `shift` value (can be a negative value).
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param shift Offset shift. Can be a negative value.
     * @returns Shifted position.
     */
    getShiftedBy(shift: number): Position;
    /**
     * Checks whether this position is after given position.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @see module:engine/model/position~Position#isBefore
     * @param  otherPosition Position to compare with.
     * @returns True if this position is after given position.
     */
    isAfter(otherPosition: Position): boolean;
    /**
     * Checks whether this position is before given position.
     *
     * **Note:** watch out when using negation of the value returned by this method, because the negation will also
     * be `true` if positions are in different roots and you might not expect this. You should probably use
     * `a.isAfter( b ) || a.isEqual( b )` or `!a.isBefore( p ) && a.root == b.root` in most scenarios. If your
     * condition uses multiple `isAfter` and `isBefore` checks, build them so they do not use negated values, i.e.:
     *
     * ```ts
     * if ( a.isBefore( b ) && c.isAfter( d ) ) {
     * 	// do A.
     * } else {
     * 	// do B.
     * }
     * ```
     *
     * or, if you have only one if-branch:
     *
     * ```ts
     * if ( !( a.isBefore( b ) && c.isAfter( d ) ) {
     * 	// do B.
     * }
     * ```
     *
     * rather than:
     *
     * ```ts
     * if ( !a.isBefore( b ) || && !c.isAfter( d ) ) {
     * 	// do B.
     * } else {
     * 	// do A.
     * }
     * ```
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param otherPosition Position to compare with.
     * @returns True if this position is before given position.
     */
    isBefore(otherPosition: Position): boolean;
    /**
     * Checks whether this position is equal to given position.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param otherPosition Position to compare with.
     * @returns True if positions are same.
     */
    isEqual(otherPosition: Position): boolean;
    /**
     * Checks whether this position is touching given position. Positions touch when there are no text nodes
     * or empty nodes in a range between them. Technically, those positions are not equal but in many cases
     * they are very similar or even indistinguishable.
     *
     * @param otherPosition Position to compare with.
     * @returns True if positions touch.
     */
    isTouching(otherPosition: Position): boolean;
    /**
     * Checks if two positions are in the same parent.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param position Position to compare with.
     * @returns `true` if positions have the same parent, `false` otherwise.
     */
    hasSameParentAs(position: Position): boolean;
    /**
     * Returns a copy of this position that is transformed by given `operation`.
     *
     * The new position's parameters are updated accordingly to the effect of the `operation`.
     *
     * For example, if `n` nodes are inserted before the position, the returned position {@link ~Position#offset} will be
     * increased by `n`. If the position was in a merged element, it will be accordingly moved to the new element, etc.
     *
     * This method is safe to use it on non-existing positions (for example during operational transformation).
     *
     * @param operation Operation to transform by.
     * @returns Transformed position.
     */
    getTransformedByOperation(operation: Operation): Position;
    /**
     * Returns a copy of this position transformed by an insert operation.
     *
     * @internal
     */
    _getTransformedByInsertOperation(operation: InsertOperation): Position;
    /**
     * Returns a copy of this position transformed by a move operation.
     *
     * @internal
     */
    _getTransformedByMoveOperation(operation: MoveOperation): Position;
    /**
     * Returns a copy of this position transformed by a split operation.
     *
     * @internal
     */
    _getTransformedBySplitOperation(operation: SplitOperation): Position;
    /**
     * Returns a copy of this position transformed by merge operation.
     *
     * @internal
     */
    _getTransformedByMergeOperation(operation: MergeOperation): Position;
    /**
     * Returns a copy of this position that is updated by removing `howMany` nodes starting from `deletePosition`.
     * It may happen that this position is in a removed node. If that is the case, `null` is returned instead.
     *
     * @internal
     * @param deletePosition Position before the first removed node.
     * @param howMany How many nodes are removed.
     * @returns Transformed position or `null`.
     */
    _getTransformedByDeletion(deletePosition: Position, howMany: number): Position | null;
    /**
     * Returns a copy of this position that is updated by inserting `howMany` nodes at `insertPosition`.
     *
     * @internal
     * @param insertPosition Position where nodes are inserted.
     * @param howMany How many nodes are inserted.
     * @returns Transformed position.
     */
    _getTransformedByInsertion(insertPosition: Position, howMany: number): Position;
    /**
     * Returns a copy of this position that is updated by moving `howMany` nodes from `sourcePosition` to `targetPosition`.
     *
     * @internal
     * @param sourcePosition Position before the first element to move.
     * @param targetPosition Position where moved elements will be inserted.
     * @param howMany How many consecutive nodes to move, starting from `sourcePosition`.
     * @returns Transformed position.
     */
    _getTransformedByMove(sourcePosition: Position, targetPosition: Position, howMany: number): Position;
    /**
     * Returns a new position that is a combination of this position and given positions.
     *
     * The combined position is a copy of this position transformed by moving a range starting at `source` position
     * to the `target` position. It is expected that this position is inside the moved range.
     *
     * Example:
     *
     * ```ts
     * let original = model.createPositionFromPath( root, [ 2, 3, 1 ] );
     * let source = model.createPositionFromPath( root, [ 2, 2 ] );
     * let target = model.createPositionFromPath( otherRoot, [ 1, 1, 3 ] );
     * original._getCombined( source, target ); // path is [ 1, 1, 4, 1 ], root is `otherRoot`
     * ```
     *
     * Explanation:
     *
     * We have a position `[ 2, 3, 1 ]` and move some nodes from `[ 2, 2 ]` to `[ 1, 1, 3 ]`. The original position
     * was inside moved nodes and now should point to the new place. The moved nodes will be after
     * positions `[ 1, 1, 3 ]`, `[ 1, 1, 4 ]`, `[ 1, 1, 5 ]`. Since our position was in the second moved node,
     * the transformed position will be in a sub-tree of a node at `[ 1, 1, 4 ]`. Looking at original path, we
     * took care of `[ 2, 3 ]` part of it. Now we have to add the rest of the original path to the transformed path.
     * Finally, the transformed position will point to `[ 1, 1, 4, 1 ]`.
     *
     * @internal
     * @param source Beginning of the moved range.
     * @param target Position where the range is moved.
     * @returns Combined position.
     */
    _getCombined(source: Position, target: Position): Position;
    /**
     * @inheritDoc
     */
    toJSON(): unknown;
    /**
     * Returns a new position that is equal to current position.
     */
    clone(): this;
    /**
     * Creates position at the given location. The location can be specified as:
     *
     * * a {@link module:engine/model/position~Position position},
     * * parent element and offset (offset defaults to `0`),
     * * parent element and `'end'` (sets position at the end of that element),
     * * {@link module:engine/model/item~Item model item} and `'before'` or `'after'` (sets position before or after given model item).
     *
     * This method is a shortcut to other factory methods such as:
     *
     * * {@link module:engine/model/position~Position._createBefore},
     * * {@link module:engine/model/position~Position._createAfter}.
     *
     * @internal
     * @param offset Offset or one of the flags. Used only when the first parameter is a {@link module:engine/model/item~Item model item}.
     * @param stickiness Position stickiness. Used only when the first parameter is a {@link module:engine/model/item~Item model item}.
     */
    static _createAt(itemOrPosition: Item | Position | DocumentFragment, offset?: PositionOffset, stickiness?: PositionStickiness): Position;
    /**
     * Creates a new position, after given {@link module:engine/model/item~Item model item}.
     *
     * @internal
     * @param item Item after which the position should be placed.
     * @param stickiness Position stickiness.
     */
    static _createAfter(item: Item | DocumentFragment, stickiness?: PositionStickiness): Position;
    /**
     * Creates a new position, before the given {@link module:engine/model/item~Item model item}.
     *
     * @internal
     * @param item Item before which the position should be placed.
     * @param stickiness Position stickiness.
     */
    static _createBefore(item: Item | DocumentFragment, stickiness?: PositionStickiness): Position;
    /**
     * Creates a `Position` instance from given plain object (i.e. parsed JSON string).
     *
     * @param json Plain object to be converted to `Position`.
     * @param doc Document object that will be position owner.
     * @returns `Position` instance created using given plain object.
     */
    static fromJSON(json: any, doc: Document): Position;
}
/**
 * A flag indicating whether this position is `'before'` or `'after'` or `'same'` as given position.
 * If positions are in different roots `'different'` flag is returned.
 */
export type PositionRelation = 'before' | 'after' | 'same' | 'different';
/**
 * Offset or one of the flags.
 */
export type PositionOffset = number | 'before' | 'after' | 'end';
/**
 * Represents how position is "sticking" with neighbour nodes. Used to define how position should be transformed (moved)
 * in edge cases. Possible values: `'toNone'`, `'toNext'`, `'toPrevious'`.
 *
 * Examples:
 *
 * ```
 * Insert. Position is at | and nodes are inserted at the same position, marked as ^:
 *
 * - sticks to none:           <p>f^|oo</p>  ->  <p>fbar|oo</p>
 * - sticks to next node:      <p>f^|oo</p>  ->  <p>fbar|oo</p>
 * - sticks to previous node:  <p>f|^oo</p>  ->  <p>f|baroo</p>
 * ```
 *
 *
 * Move. Position is at | and range [oo] is moved to position ^:
 *
 * ```
 * - sticks to none:           <p>f|[oo]</p><p>b^ar</p>  ->  <p>f|</p><p>booar</p>
 * - sticks to none:           <p>f[oo]|</p><p>b^ar</p>  ->  <p>f|</p><p>booar</p>
 *
 * - sticks to next node:      <p>f|[oo]</p><p>b^ar</p>  ->  <p>f</p><p>b|ooar</p>
 * - sticks to next node:      <p>f[oo]|</p><p>b^ar</p>  ->  <p>f|</p><p>booar</p>
 *
 * - sticks to previous node:  <p>f|[oo]</p><p>b^ar</p>  ->  <p>f|</p><p>booar</p>
 * - sticks to previous node:  <p>f[oo]|</p><p>b^ar</p>  ->  <p>f</p><p>boo|ar</p>
 * ```
 */
export type PositionStickiness = 'toNone' | 'toNext' | 'toPrevious';
/**
 * Returns a text node at the given position.
 *
 * This is a helper function optimized to reuse the position parent instance for performance reasons.
 *
 * Normally, you should use {@link module:engine/model/position~Position#textNode `Position#textNode`}.
 * If you start hitting performance issues with {@link module:engine/model/position~Position#parent `Position#parent`}
 * check if your algorithm does not access it multiple times (which can happen directly or indirectly via other position properties).
 *
 * See https://github.com/ckeditor/ckeditor5/issues/6579.
 *
 * See also:
 *
 * * {@link module:engine/model/position~getNodeAfterPosition}
 * * {@link module:engine/model/position~getNodeBeforePosition}
 *
 * @param positionParent The parent of the given position.
 */
export declare function getTextNodeAtPosition(position: Position, positionParent: Element | DocumentFragment): Text | null;
/**
 * Returns the node after the given position.
 *
 * This is a helper function optimized to reuse the position parent instance and the calculation of the text node at the
 * specific position for performance reasons.
 *
 * Normally, you should use {@link module:engine/model/position~Position#nodeAfter `Position#nodeAfter`}.
 * If you start hitting performance issues with {@link module:engine/model/position~Position#parent `Position#parent`} and/or
 * {@link module:engine/model/position~Position#textNode `Position#textNode`}
 * check if your algorithm does not access those properties multiple times
 * (which can happen directly or indirectly via other position properties).
 *
 * See https://github.com/ckeditor/ckeditor5/issues/6579 and https://github.com/ckeditor/ckeditor5/issues/6582.
 *
 * See also:
 *
 * * {@link module:engine/model/position~getTextNodeAtPosition}
 * * {@link module:engine/model/position~getNodeBeforePosition}
 *
 * @param positionParent The parent of the given position.
 * @param textNode Text node at the given position.
 */
export declare function getNodeAfterPosition(position: Position, positionParent: Element | DocumentFragment, textNode: Text | null): Node | null;
/**
 * Returns the node before the given position.
 *
 * Refer to {@link module:engine/model/position~getNodeBeforePosition} for documentation on when to use this util method.
 *
 * See also:
 *
 * * {@link module:engine/model/position~getTextNodeAtPosition}
 * * {@link module:engine/model/position~getNodeAfterPosition}
 *
 * @param positionParent The parent of the given position.
 * @param textNode Text node at the given position.
 */
export declare function getNodeBeforePosition(position: Position, positionParent: Element | DocumentFragment, textNode: Text | null): Node | null;
