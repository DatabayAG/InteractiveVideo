/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Abstract base operation class.
 */
export default class Operation {
    /**
     * Base operation constructor.
     *
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(baseVersion) {
        this.baseVersion = baseVersion;
        this.isDocumentOperation = this.baseVersion !== null;
        this.batch = null;
    }
    /**
     * Checks whether the operation's parameters are correct and the operation can be correctly executed. Throws
     * an error if operation is not valid.
     *
     * @internal
     */
    _validate() {
    }
    /**
     * Custom toJSON method to solve child-parent circular dependencies.
     *
     * @returns Clone of this object with the operation property replaced with string.
     */
    toJSON() {
        // This method creates only a shallow copy, all nested objects should be defined separately.
        // See https://github.com/ckeditor/ckeditor5-engine/issues/1477.
        const json = Object.assign({}, this);
        json.__className = this.constructor.className;
        // Remove reference to the parent `Batch` to avoid circular dependencies.
        delete json.batch;
        // Only document operations are shared with other clients so it is not necessary to keep this information.
        delete json.isDocumentOperation;
        return json;
    }
    /**
     * Name of the operation class used for serialization.
     */
    static get className() {
        return 'Operation';
    }
    /**
     * Creates `Operation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param doc Document on which this operation will be applied.
     */
    static fromJSON(json, document) {
        return new this(json.baseVersion);
    }
}
