/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/textproxy
 */
import TypeCheckable from './typecheckable.js';
import type DocumentFragment from './documentfragment.js';
import type Element from './element.js';
import type Node from './node.js';
import type Text from './text.js';
/**
 * `TextProxy` represents a part of {@link module:engine/model/text~Text text node}.
 *
 * Since {@link module:engine/model/position~Position positions} can be placed between characters of a text node,
 * {@link module:engine/model/range~Range ranges} may contain only parts of text nodes. When {@link module:engine/model/range~Range#getItems
 * getting items}
 * contained in such range, we need to represent a part of that text node, since returning the whole text node would be incorrect.
 * `TextProxy` solves this issue.
 *
 * `TextProxy` has an API similar to {@link module:engine/model/text~Text Text} and allows to do most of the common tasks performed
 * on model nodes.
 *
 * **Note:** Some `TextProxy` instances may represent whole text node, not just a part of it.
 * See {@link module:engine/model/textproxy~TextProxy#isPartial}.
 *
 * **Note:** `TextProxy` is not an instance of {@link module:engine/model/node~Node node}. Keep this in mind when using it as a
 * parameter of methods.
 *
 * **Note:** `TextProxy` is a readonly interface. If you want to perform changes on model data represented by a `TextProxy`
 * use {@link module:engine/model/writer~Writer model writer API}.
 *
 * **Note:** `TextProxy` instances are created on the fly, basing on the current state of model. Because of this, it is
 * highly unrecommended to store references to `TextProxy` instances. `TextProxy` instances are not refreshed when
 * model changes, so they might get invalidated. Instead, consider creating {@link module:engine/model/liveposition~LivePosition live
 * position}.
 *
 * `TextProxy` instances are created by {@link module:engine/model/treewalker~TreeWalker model tree walker}. You should not need to create
 * an instance of this class by your own.
 */
export default class TextProxy extends TypeCheckable {
    /**
     * Text node which part is represented by this text proxy.
     */
    readonly textNode: Text;
    /**
     * Text data represented by this text proxy.
     */
    readonly data: string;
    /**
     * Offset in {@link module:engine/model/textproxy~TextProxy#textNode text node} from which the text proxy starts.
     */
    readonly offsetInText: number;
    /**
     * Creates a text proxy.
     *
     * @internal
     * @param textNode Text node which part is represented by this text proxy.
     * @param offsetInText Offset in {@link module:engine/model/textproxy~TextProxy#textNode text node} from which the text proxy
     * starts.
     * @param length Text proxy length, that is how many text node's characters, starting from `offsetInText` it represents.
     */
    constructor(textNode: Text, offsetInText: number, length: number);
    /**
     * Offset at which this text proxy starts in it's parent.
     *
     * @see module:engine/model/node~Node#startOffset
     */
    get startOffset(): number | null;
    /**
     * Offset size of this text proxy. Equal to the number of characters represented by the text proxy.
     *
     * @see module:engine/model/node~Node#offsetSize
     */
    get offsetSize(): number;
    /**
     * Offset at which this text proxy ends in it's parent.
     *
     * @see module:engine/model/node~Node#endOffset
     */
    get endOffset(): number | null;
    /**
     * Flag indicating whether `TextProxy` instance covers only part of the original {@link module:engine/model/text~Text text node}
     * (`true`) or the whole text node (`false`).
     *
     * This is `false` when text proxy starts at the very beginning of {@link module:engine/model/textproxy~TextProxy#textNode textNode}
     * ({@link module:engine/model/textproxy~TextProxy#offsetInText offsetInText} equals `0`) and text proxy sizes is equal to
     * text node size.
     */
    get isPartial(): boolean;
    /**
     * Parent of this text proxy, which is same as parent of text node represented by this text proxy.
     */
    get parent(): Element | DocumentFragment | null;
    /**
     * Root of this text proxy, which is same as root of text node represented by this text proxy.
     */
    get root(): Node | DocumentFragment;
    /**
     * Gets path to this text proxy.
     *
     * @see module:engine/model/node~Node#getPath
     */
    getPath(): Array<number>;
    /**
     * Returns ancestors array of this text proxy.
     *
     * @param options Options object.
     * @param options.includeSelf When set to `true` this text proxy will be also included in parent's array.
     * @param options.parentFirst When set to `true`, array will be sorted from text proxy parent to root element,
     * otherwise root element will be the first item in the array.
     * @returns Array with ancestors.
     */
    getAncestors(options?: {
        includeSelf?: boolean;
        parentFirst?: boolean;
    }): Array<TextProxy | Element | DocumentFragment>;
    /**
     * Checks if this text proxy has an attribute for given key.
     *
     * @param key Key of attribute to check.
     * @returns `true` if attribute with given key is set on text proxy, `false` otherwise.
     */
    hasAttribute(key: string): boolean;
    /**
     * Gets an attribute value for given key or `undefined` if that attribute is not set on text proxy.
     *
     * @param key Key of attribute to look for.
     * @returns Attribute value or `undefined`.
     */
    getAttribute(key: string): unknown;
    /**
     * Returns iterator that iterates over this node's attributes. Attributes are returned as arrays containing two
     * items. First one is attribute key and second is attribute value.
     *
     * This format is accepted by native `Map` object and also can be passed in `Node` constructor.
     */
    getAttributes(): IterableIterator<[string, unknown]>;
    /**
     * Returns iterator that iterates over this node's attribute keys.
     */
    getAttributeKeys(): IterableIterator<string>;
}
