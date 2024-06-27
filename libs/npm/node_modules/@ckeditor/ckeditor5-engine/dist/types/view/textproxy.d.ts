/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/textproxy
 */
import TypeCheckable from './typecheckable.js';
import type Document from './document.js';
import type DocumentFragment from './documentfragment.js';
import type Element from './element.js';
import type Node from './node.js';
import type Text from './text.js';
/**
 * TextProxy is a wrapper for substring of {@link module:engine/view/text~Text}. Instance of this class is created by
 * {@link module:engine/view/treewalker~TreeWalker} when only a part of {@link module:engine/view/text~Text} needs to be returned.
 *
 * `TextProxy` has an API similar to {@link module:engine/view/text~Text Text} and allows to do most of the common tasks performed
 * on view nodes.
 *
 * **Note:** Some `TextProxy` instances may represent whole text node, not just a part of it.
 * See {@link module:engine/view/textproxy~TextProxy#isPartial}.
 *
 * **Note:** `TextProxy` is a readonly interface.
 *
 * **Note:** `TextProxy` instances are created on the fly basing on the current state of parent {@link module:engine/view/text~Text}.
 * Because of this it is highly unrecommended to store references to `TextProxy instances because they might get
 * invalidated due to operations on Document. Also TextProxy is not a {@link module:engine/view/node~Node} so it can not be
 * inserted as a child of {@link module:engine/view/element~Element}.
 *
 * `TextProxy` instances are created by {@link module:engine/view/treewalker~TreeWalker view tree walker}. You should not need to create
 * an instance of this class by your own.
 */
export default class TextProxy extends TypeCheckable {
    /**
     * Reference to the {@link module:engine/view/text~Text} element which TextProxy is a substring.
     */
    readonly textNode: Text;
    /**
     * Text data represented by this text proxy.
     */
    readonly data: string;
    /**
     * Offset in the `textNode` where this `TextProxy` instance starts.
     */
    readonly offsetInText: number;
    /**
     * Creates a text proxy.
     *
     * @internal
     * @param textNode Text node which part is represented by this text proxy.
     * @param offsetInText Offset in {@link module:engine/view/textproxy~TextProxy#textNode text node}
     * from which the text proxy starts.
     * @param length Text proxy length, that is how many text node's characters, starting from `offsetInText` it represents.
     * @constructor
     */
    constructor(textNode: Text, offsetInText: number, length: number);
    /**
     * Offset size of this node.
     */
    get offsetSize(): number;
    /**
     * Flag indicating whether `TextProxy` instance covers only part of the original {@link module:engine/view/text~Text text node}
     * (`true`) or the whole text node (`false`).
     *
     * This is `false` when text proxy starts at the very beginning of {@link module:engine/view/textproxy~TextProxy#textNode textNode}
     * ({@link module:engine/view/textproxy~TextProxy#offsetInText offsetInText} equals `0`) and text proxy sizes is equal to
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
     * {@link module:engine/view/document~Document View document} that owns this text proxy, or `null` if the text proxy is inside
     * {@link module:engine/view/documentfragment~DocumentFragment document fragment}.
     */
    get document(): Document | null;
    /**
     * Returns ancestors array of this text proxy.
     *
     * @param options Options object.
     * @param options.includeSelf When set to `true`, textNode will be also included in parent's array.
     * @param options.parentFirst When set to `true`, array will be sorted from text proxy parent to
     * root element, otherwise root element will be the first item in the array.
     * @returns Array with ancestors.
     */
    getAncestors(options?: {
        includeSelf?: boolean;
        parentFirst?: boolean;
    }): Array<Text | Element | DocumentFragment>;
}
