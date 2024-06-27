/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/textproxy
 */
import TypeCheckable from './typecheckable.js';
import { CKEditorError } from '@ckeditor/ckeditor5-utils';
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
     * Creates a text proxy.
     *
     * @internal
     * @param textNode Text node which part is represented by this text proxy.
     * @param offsetInText Offset in {@link module:engine/view/textproxy~TextProxy#textNode text node}
     * from which the text proxy starts.
     * @param length Text proxy length, that is how many text node's characters, starting from `offsetInText` it represents.
     * @constructor
     */
    constructor(textNode, offsetInText, length) {
        super();
        this.textNode = textNode;
        if (offsetInText < 0 || offsetInText > textNode.data.length) {
            /**
             * Given offsetInText value is incorrect.
             *
             * @error view-textproxy-wrong-offsetintext
             */
            throw new CKEditorError('view-textproxy-wrong-offsetintext', this);
        }
        if (length < 0 || offsetInText + length > textNode.data.length) {
            /**
             * Given length value is incorrect.
             *
             * @error view-textproxy-wrong-length
             */
            throw new CKEditorError('view-textproxy-wrong-length', this);
        }
        this.data = textNode.data.substring(offsetInText, offsetInText + length);
        this.offsetInText = offsetInText;
    }
    /**
     * Offset size of this node.
     */
    get offsetSize() {
        return this.data.length;
    }
    /**
     * Flag indicating whether `TextProxy` instance covers only part of the original {@link module:engine/view/text~Text text node}
     * (`true`) or the whole text node (`false`).
     *
     * This is `false` when text proxy starts at the very beginning of {@link module:engine/view/textproxy~TextProxy#textNode textNode}
     * ({@link module:engine/view/textproxy~TextProxy#offsetInText offsetInText} equals `0`) and text proxy sizes is equal to
     * text node size.
     */
    get isPartial() {
        return this.data.length !== this.textNode.data.length;
    }
    /**
     * Parent of this text proxy, which is same as parent of text node represented by this text proxy.
     */
    get parent() {
        return this.textNode.parent;
    }
    /**
     * Root of this text proxy, which is same as root of text node represented by this text proxy.
     */
    get root() {
        return this.textNode.root;
    }
    /**
     * {@link module:engine/view/document~Document View document} that owns this text proxy, or `null` if the text proxy is inside
     * {@link module:engine/view/documentfragment~DocumentFragment document fragment}.
     */
    get document() {
        return this.textNode.document;
    }
    /**
     * Returns ancestors array of this text proxy.
     *
     * @param options Options object.
     * @param options.includeSelf When set to `true`, textNode will be also included in parent's array.
     * @param options.parentFirst When set to `true`, array will be sorted from text proxy parent to
     * root element, otherwise root element will be the first item in the array.
     * @returns Array with ancestors.
     */
    getAncestors(options = {}) {
        const ancestors = [];
        let parent = options.includeSelf ? this.textNode : this.parent;
        while (parent !== null) {
            ancestors[options.parentFirst ? 'push' : 'unshift'](parent);
            parent = parent.parent;
        }
        return ancestors;
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
TextProxy.prototype.is = function (type) {
    return type === '$textProxy' || type === 'view:$textProxy' ||
        // This are legacy values kept for backward compatibility.
        type === 'textProxy' || type === 'view:textProxy';
};
