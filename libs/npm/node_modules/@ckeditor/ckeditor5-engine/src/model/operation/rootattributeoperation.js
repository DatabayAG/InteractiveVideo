/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/rootattributeoperation
 */
import Operation from './operation.js';
import { CKEditorError } from '@ckeditor/ckeditor5-utils';
/**
 * Operation to change root element's attribute. Using this class you can add, remove or change value of the attribute.
 *
 * This operation is needed, because root elements can't be changed through
 * {@link module:engine/model/operation/attributeoperation~AttributeOperation}.
 * It is because {@link module:engine/model/operation/attributeoperation~AttributeOperation}
 * requires a range to change and root element can't
 * be a part of range because every {@link module:engine/model/position~Position} has to be inside a root.
 * {@link module:engine/model/position~Position} can't be created before a root element.
 */
export default class RootAttributeOperation extends Operation {
    /**
     * Creates an operation that changes, removes or adds attributes on root element.
     *
     * @see module:engine/model/operation/attributeoperation~AttributeOperation
     * @param root Root element to change.
     * @param key Key of an attribute to change or remove.
     * @param oldValue Old value of the attribute with given key or `null`, if attribute was not set before.
     * @param newValue New value of the attribute with given key or `null`, if operation should remove attribute.
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(root, key, oldValue, newValue, baseVersion) {
        super(baseVersion);
        this.root = root;
        this.key = key;
        this.oldValue = oldValue === undefined ? null : oldValue;
        this.newValue = newValue === undefined ? null : newValue;
    }
    /**
     * @inheritDoc
     */
    get type() {
        if (this.oldValue === null) {
            return 'addRootAttribute';
        }
        else if (this.newValue === null) {
            return 'removeRootAttribute';
        }
        else {
            return 'changeRootAttribute';
        }
    }
    /**
     * @inheritDoc
     */
    get affectedSelectable() {
        return this.root;
    }
    /**
     * Creates and returns an operation that has the same parameters as this operation.
     *
     * @returns Clone of this operation.
     */
    clone() {
        return new RootAttributeOperation(this.root, this.key, this.oldValue, this.newValue, this.baseVersion);
    }
    /**
     * See {@link module:engine/model/operation/operation~Operation#getReversed `Operation#getReversed()`}.
     */
    getReversed() {
        return new RootAttributeOperation(this.root, this.key, this.newValue, this.oldValue, this.baseVersion + 1);
    }
    /**
     * @inheritDoc
     * @internal
     */
    _validate() {
        if (this.root != this.root.root || this.root.is('documentFragment')) {
            /**
             * The element to change is not a root element.
             *
             * @error rootattribute-operation-not-a-root
             * @param root
             * @param key
             * @param value
             */
            throw new CKEditorError('rootattribute-operation-not-a-root', this, { root: this.root, key: this.key });
        }
        if (this.oldValue !== null && this.root.getAttribute(this.key) !== this.oldValue) {
            /**
             * The attribute which should be removed does not exist for the given node.
             *
             * @error rootattribute-operation-wrong-old-value
             * @param root
             * @param key
             * @param value
             */
            throw new CKEditorError('rootattribute-operation-wrong-old-value', this, { root: this.root, key: this.key });
        }
        if (this.oldValue === null && this.newValue !== null && this.root.hasAttribute(this.key)) {
            /**
             * The attribute with given key already exists for the given node.
             *
             * @error rootattribute-operation-attribute-exists
             * @param root
             * @param key
             */
            throw new CKEditorError('rootattribute-operation-attribute-exists', this, { root: this.root, key: this.key });
        }
    }
    /**
     * @inheritDoc
     * @internal
     */
    _execute() {
        if (this.newValue !== null) {
            this.root._setAttribute(this.key, this.newValue);
        }
        else {
            this.root._removeAttribute(this.key);
        }
    }
    /**
     * @inheritDoc
     */
    toJSON() {
        const json = super.toJSON();
        json.root = this.root.toJSON();
        return json;
    }
    /**
     * @inheritDoc
     */
    static get className() {
        return 'RootAttributeOperation';
    }
    /**
     * Creates `RootAttributeOperation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param document Document on which this operation will be applied.
     */
    static fromJSON(json, document) {
        if (!document.getRoot(json.root)) {
            /**
             * Cannot create RootAttributeOperation for document. Root with specified name does not exist.
             *
             * @error rootattribute-operation-fromjson-no-root
             * @param rootName
             */
            throw new CKEditorError('rootattribute-operation-fromjson-no-root', this, { rootName: json.root });
        }
        return new RootAttributeOperation(document.getRoot(json.root), json.key, json.oldValue, json.newValue, json.baseVersion);
    }
}
