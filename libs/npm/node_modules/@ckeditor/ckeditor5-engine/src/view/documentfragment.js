/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/documentfragment
 */
import TypeCheckable from './typecheckable.js';
import Text from './text.js';
import TextProxy from './textproxy.js';
import { EmitterMixin, isIterable } from '@ckeditor/ckeditor5-utils';
/**
 * Document fragment.
 *
 * To create a new document fragment instance use the
 * {@link module:engine/view/upcastwriter~UpcastWriter#createDocumentFragment `UpcastWriter#createDocumentFragment()`}
 * method.
 */
export default class DocumentFragment extends /* #__PURE__ */ EmitterMixin(TypeCheckable) {
    /**
     * Creates new DocumentFragment instance.
     *
     * @internal
     * @param document The document to which this document fragment belongs.
     * @param children A list of nodes to be inserted into the created document fragment.
     */
    constructor(document, children) {
        super();
        /**
         * Array of child nodes.
         */
        this._children = [];
        /**
         * Map of custom properties.
         * Custom properties can be added to document fragment instance.
         */
        this._customProperties = new Map();
        this.document = document;
        if (children) {
            this._insertChild(0, children);
        }
    }
    /**
     * Iterable interface.
     *
     * Iterates over nodes added to this document fragment.
     */
    [Symbol.iterator]() {
        return this._children[Symbol.iterator]();
    }
    /**
     * Number of child nodes in this document fragment.
     */
    get childCount() {
        return this._children.length;
    }
    /**
     * Is `true` if there are no nodes inside this document fragment, `false` otherwise.
     */
    get isEmpty() {
        return this.childCount === 0;
    }
    /**
     * Artificial root of `DocumentFragment`. Returns itself. Added for compatibility reasons.
     */
    get root() {
        return this;
    }
    /**
     * Artificial parent of `DocumentFragment`. Returns `null`. Added for compatibility reasons.
     */
    get parent() {
        return null;
    }
    /**
     * Artificial element name. Returns `undefined`. Added for compatibility reasons.
     */
    get name() {
        return undefined;
    }
    /**
     * Artificial element getFillerOffset. Returns `undefined`. Added for compatibility reasons.
     */
    get getFillerOffset() {
        return undefined;
    }
    /**
     * Returns the custom property value for the given key.
     */
    getCustomProperty(key) {
        return this._customProperties.get(key);
    }
    /**
     * Returns an iterator which iterates over this document fragment's custom properties.
     * Iterator provides `[ key, value ]` pairs for each stored property.
     */
    *getCustomProperties() {
        yield* this._customProperties.entries();
    }
    /**
     * {@link module:engine/view/documentfragment~DocumentFragment#_insertChild Insert} a child node or a list of child nodes at the end
     * and sets the parent of these nodes to this fragment.
     *
     * @internal
     * @param items Items to be inserted.
     * @returns Number of appended nodes.
     */
    _appendChild(items) {
        return this._insertChild(this.childCount, items);
    }
    /**
     * Gets child at the given index.
     *
     * @param index Index of child.
     * @returns Child node.
     */
    getChild(index) {
        return this._children[index];
    }
    /**
     * Gets index of the given child node. Returns `-1` if child node is not found.
     *
     * @param node Child node.
     * @returns Index of the child node.
     */
    getChildIndex(node) {
        return this._children.indexOf(node);
    }
    /**
     * Gets child nodes iterator.
     *
     * @returns Child nodes iterator.
     */
    getChildren() {
        return this._children[Symbol.iterator]();
    }
    /**
     * Inserts a child node or a list of child nodes on the given index and sets the parent of these nodes to
     * this fragment.
     *
     * @internal
     * @param index Position where nodes should be inserted.
     * @param items Items to be inserted.
     * @returns Number of inserted nodes.
     */
    _insertChild(index, items) {
        this._fireChange('children', this);
        let count = 0;
        const nodes = normalize(this.document, items);
        for (const node of nodes) {
            // If node that is being added to this element is already inside another element, first remove it from the old parent.
            if (node.parent !== null) {
                node._remove();
            }
            node.parent = this;
            this._children.splice(index, 0, node);
            index++;
            count++;
        }
        return count;
    }
    /**
     * Removes number of child nodes starting at the given index and set the parent of these nodes to `null`.
     *
     * @internal
     * @param index Number of the first node to remove.
     * @param howMany Number of nodes to remove.
     * @returns The array of removed nodes.
     */
    _removeChildren(index, howMany = 1) {
        this._fireChange('children', this);
        for (let i = index; i < index + howMany; i++) {
            this._children[i].parent = null;
        }
        return this._children.splice(index, howMany);
    }
    /**
     * Fires `change` event with given type of the change.
     *
     * @internal
     * @param type Type of the change.
     * @param node Changed node.
     */
    _fireChange(type, node) {
        this.fire('change:' + type, node);
    }
    /**
     * Sets a custom property. They can be used to add special data to elements.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setCustomProperty
     * @internal
     */
    _setCustomProperty(key, value) {
        this._customProperties.set(key, value);
    }
    /**
     * Removes the custom property stored under the given key.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeCustomProperty
     * @internal
     * @returns Returns true if property was removed.
     */
    _removeCustomProperty(key) {
        return this._customProperties.delete(key);
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
DocumentFragment.prototype.is = function (type) {
    return type === 'documentFragment' || type === 'view:documentFragment';
};
/**
 * Converts strings to Text and non-iterables to arrays.
 */
function normalize(document, nodes) {
    // Separate condition because string is iterable.
    if (typeof nodes == 'string') {
        return [new Text(document, nodes)];
    }
    if (!isIterable(nodes)) {
        nodes = [nodes];
    }
    // Array.from to enable .map() on non-arrays.
    return Array.from(nodes)
        .map(node => {
        if (typeof node == 'string') {
            return new Text(document, node);
        }
        if (node instanceof TextProxy) {
            return new Text(document, node.data);
        }
        return node;
    });
}
