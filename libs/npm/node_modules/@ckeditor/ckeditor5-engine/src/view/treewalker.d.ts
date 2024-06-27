/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import Position from './position.js';
import type Item from './item.js';
import type Range from './range.js';
/**
 * Position iterator class. It allows to iterate forward and backward over the document.
 */
export default class TreeWalker implements IterableIterator<TreeWalkerValue> {
    /**
     * Walking direction. Defaults `'forward'`.
     */
    readonly direction: TreeWalkerDirection;
    /**
     * Iterator boundaries.
     *
     * When the iterator is walking `'forward'` on the end of boundary or is walking `'backward'`
     * on the start of boundary, then `{ done: true }` is returned.
     *
     * If boundaries are not defined they are set before first and after last child of the root node.
     */
    readonly boundaries: Range | null;
    /**
     * Flag indicating whether all characters from {@link module:engine/view/text~Text} should be returned as one
     * {@link module:engine/view/text~Text} or one by one as {@link module:engine/view/textproxy~TextProxy}.
     */
    readonly singleCharacters: boolean;
    /**
     * Flag indicating whether iterator should enter elements or not. If the iterator is shallow child nodes of any
     * iterated node will not be returned along with `elementEnd` tag.
     */
    readonly shallow: boolean;
    /**
     * Flag indicating whether iterator should ignore `elementEnd` tags. If set to `true`, walker will not
     * return a parent node of the start position. Each {@link module:engine/view/element~Element} will be returned once.
     * When set to `false` each element might be returned twice: for `'elementStart'` and `'elementEnd'`.
     */
    readonly ignoreElementEnd: boolean;
    /**
     * Iterator position. If start position is not defined then position depends on {@link #direction}. If direction is
     * `'forward'` position starts form the beginning, when direction is `'backward'` position starts from the end.
     */
    private _position;
    /**
     * Start boundary parent.
     */
    private readonly _boundaryStartParent;
    /**
     * End boundary parent.
     */
    private readonly _boundaryEndParent;
    /**
     * Creates a range iterator. All parameters are optional, but you have to specify either `boundaries` or `startPosition`.
     *
     * @param options Object with configuration.
     */
    constructor(options?: TreeWalkerOptions);
    /**
     * Iterable interface.
     */
    [Symbol.iterator](): IterableIterator<TreeWalkerValue>;
    /**
     * Iterator position. If start position is not defined then position depends on {@link #direction}. If direction is
     * `'forward'` position starts form the beginning, when direction is `'backward'` position starts from the end.
     */
    get position(): Position;
    /**
     * Moves {@link #position} in the {@link #direction} skipping values as long as the callback function returns `true`.
     *
     * For example:
     *
     * ```ts
     * walker.skip( value => value.type == 'text' ); // <p>{}foo</p> -> <p>foo[]</p>
     * walker.skip( value => true ); // Move the position to the end: <p>{}foo</p> -> <p>foo</p>[]
     * walker.skip( value => false ); // Do not move the position.
     * ```
     *
     * @param skip Callback function. Gets {@link module:engine/view/treewalker~TreeWalkerValue} and should
     * return `true` if the value should be skipped or `false` if not.
     */
    skip(skip: (value: TreeWalkerValue) => boolean): void;
    /**
     * Gets the next tree walker's value.
     *
     * @returns Object implementing iterator interface, returning
     * information about taken step.
     */
    next(): IteratorResult<TreeWalkerValue, undefined>;
    /**
     * Makes a step forward in view. Moves the {@link #position} to the next position and returns the encountered value.
     */
    private _next;
    /**
     * Makes a step backward in view. Moves the {@link #position} to the previous position and returns the encountered value.
     */
    private _previous;
    /**
     * Format returned data and adjust `previousPosition` and `nextPosition` if reach the bound of the {@link module:engine/view/text~Text}.
     *
     * @param type Type of step.
     * @param item Item between old and new position.
     * @param previousPosition Previous position of iterator.
     * @param nextPosition Next position of iterator.
     * @param length Length of the item.
     */
    private _formatReturnValue;
}
/**
 * Type of the step made by {@link module:engine/view/treewalker~TreeWalker}.
 * Possible values: `'elementStart'` if walker is at the beginning of a node, `'elementEnd'` if walker is at the end
 * of node, or `'text'` if walker traversed over single and multiple characters.
 * For {@link module:engine/view/text~Text} `elementStart` and `elementEnd` is not returned.
 */
export type TreeWalkerValueType = 'elementStart' | 'elementEnd' | 'text';
/**
 * Object returned by {@link module:engine/view/treewalker~TreeWalker} when traversing tree view.
 */
export interface TreeWalkerValue {
    /**
     * Type of the step made by {@link module:engine/view/treewalker~TreeWalker}.
     */
    type: TreeWalkerValueType;
    /**
     * Item between the old and the new positions of the tree walker.
     */
    item: Item;
    /**
     * Previous position of the iterator.
     * * Forward iteration: For `'elementEnd'` it is the last position inside the element. For all other types it is the
     * position before the item.
     * * Backward iteration: For `'elementStart'` it is the first position inside the element. For all other types it is
     * the position after item.
     * * If the position is at the beginning or at the end of the {@link module:engine/view/text~Text} it is always moved from the
     * inside of the text to its parent just before or just after that text.
     */
    previousPosition: Position;
    /**
     * Next position of the iterator.
     * * Forward iteration: For `'elementStart'` it is the first position inside the element. For all other types it is
     * the position after the item.
     * * Backward iteration: For `'elementEnd'` it is last position inside element. For all other types it is the position
     * before the item.
     * * If the position is at the beginning or at the end of the {@link module:engine/view/text~Text} it is always moved from the
     * inside of the text to its parent just before or just after that text.
     */
    nextPosition: Position;
    /**
     * Length of the item. For `'elementStart'` it is `1`. For `'text'` it is
     * the length of that text. For `'elementEnd'` it is `undefined`.
     */
    length?: number;
}
/**
 * Tree walking direction.
 */
export type TreeWalkerDirection = 'forward' | 'backward';
/**
 * The configuration of {@link ~TreeWalker}.
 */
export interface TreeWalkerOptions {
    /**
     * Walking direction.
     *
     * @default 'forward'
     */
    direction?: TreeWalkerDirection;
    /**
     * Range to define boundaries of the iterator.
     */
    boundaries?: Range | null;
    /**
     * Starting position.
     */
    startPosition?: Position;
    /**
     * Flag indicating whether all characters from
     * {@link module:engine/view/text~Text} should be returned as one {@link module:engine/view/text~Text} (`false`) or one by one as
     * {@link module:engine/view/textproxy~TextProxy} (`true`).
     */
    singleCharacters?: boolean;
    /**
     * Flag indicating whether iterator should enter elements or not. If the
     * iterator is shallow child nodes of any iterated node will not be returned along with `elementEnd` tag.
     */
    shallow?: boolean;
    /**
     * Flag indicating whether iterator should ignore `elementEnd`
     * tags. If the option is true walker will not return a parent node of start position. If this option is `true`
     * each {@link module:engine/view/element~Element} will be returned once, while if the option is `false` they might be returned
     * twice: for `'elementStart'` and `'elementEnd'`.
     */
    ignoreElementEnd?: boolean;
}
