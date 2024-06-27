/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/utils
 */
import Node from '../node.js';
import Range from '../range.js';
import type DocumentFragment from '../documentfragment.js';
import type Item from '../item.js';
import type NodeList from '../nodelist.js';
import type Position from '../position.js';
/**
 * Inserts given nodes at given position.
 *
 * @internal
 * @param position Position at which nodes should be inserted.
 * @param normalizedNodes Nodes to insert.
 * @returns Range spanning over inserted elements.
 */
export declare function _insert(position: Position, nodes: NodeSet): Range;
/**
 * Removed nodes in given range. Only {@link module:engine/model/range~Range#isFlat flat} ranges are accepted.
 *
 * @internal
 * @param range Range containing nodes to remove.
 */
export declare function _remove(this: any, range: Range): Array<Node>;
/**
 * Moves nodes in given range to given target position. Only {@link module:engine/model/range~Range#isFlat flat} ranges are accepted.
 *
 * @internal
 * @param sourceRange Range containing nodes to move.
 * @param targetPosition Position to which nodes should be moved.
 * @returns Range containing moved nodes.
 */
export declare function _move(this: any, sourceRange: Range, targetPosition: Position): Range;
/**
 * Sets given attribute on nodes in given range. The attributes are only set on top-level nodes of the range, not on its children.
 *
 * @internal
 * @param range Range containing nodes that should have the attribute set. Must be a flat range.
 * @param key Key of attribute to set.
 * @param value Attribute value.
 */
export declare function _setAttribute(range: Range, key: string, value: unknown): void;
/**
 * Normalizes given object or an array of objects to an array of {@link module:engine/model/node~Node nodes}. See
 * {@link ~NodeSet NodeSet} for details on how normalization is performed.
 *
 * @internal
 * @param nodes Objects to normalize.
 * @returns Normalized nodes.
 */
export declare function _normalizeNodes(nodes: NodeSet): Array<Node>;
/**
 * Value that can be normalized to an array of {@link module:engine/model/node~Node nodes}.
 *
 * Non-arrays are normalized as follows:
 * * {@link module:engine/model/node~Node Node} is left as is,
 * * {@link module:engine/model/textproxy~TextProxy TextProxy} and `string` are normalized to {@link module:engine/model/text~Text Text},
 * * {@link module:engine/model/nodelist~NodeList NodeList} is normalized to an array containing all nodes that are in that node list,
 * * {@link module:engine/model/documentfragment~DocumentFragment DocumentFragment} is normalized to an array containing all of it's
 * * children.
 *
 * Arrays are processed item by item like non-array values and flattened to one array. Normalization always results in
 * a flat array of {@link module:engine/model/node~Node nodes}. Consecutive text nodes (or items normalized to text nodes) will be
 * merged if they have same attributes.
 */
export type NodeSet = Item | string | NodeList | DocumentFragment | Iterable<Item | string | NodeList | DocumentFragment>;
