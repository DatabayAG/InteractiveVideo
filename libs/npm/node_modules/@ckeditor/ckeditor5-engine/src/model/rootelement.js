/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/rootelement
 */
import Element from './element.js';
/**
 * Type of {@link module:engine/model/element~Element} that is a root of a model tree.
 */
export default class RootElement extends Element {
    /**
     * Creates root element.
     *
     * @param document Document that is an owner of this root.
     * @param name Node name.
     * @param rootName Unique root name used to identify this root element by {@link module:engine/model/document~Document}.
     */
    constructor(document, name, rootName = 'main') {
        super(name);
        /**
         * @internal
         */
        this._isAttached = true;
        /**
         * Informs if the root element is loaded (default).
         *
         * @internal
         */
        this._isLoaded = true;
        this._document = document;
        this.rootName = rootName;
    }
    /**
     * {@link module:engine/model/document~Document Document} that owns this root element.
     */
    get document() {
        return this._document;
    }
    /**
     * Informs if the root element is currently attached to the document, or not.
     *
     * A detached root is equivalent to being removed and cannot contain any children or markers.
     *
     * By default, a newly added root is attached. It can be detached using
     * {@link module:engine/model/writer~Writer#detachRoot `Writer#detachRoot`}. A detached root can be re-attached again using
     * {@link module:engine/model/writer~Writer#addRoot `Writer#addRoot`}.
     */
    isAttached() {
        return this._isAttached;
    }
    /**
     * Converts `RootElement` instance to `string` containing its name.
     *
     * @returns `RootElement` instance converted to `string`.
     */
    toJSON() {
        return this.rootName;
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
RootElement.prototype.is = function (type, name) {
    if (!name) {
        return type === 'rootElement' || type === 'model:rootElement' ||
            // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
            type === 'element' || type === 'model:element' ||
            type === 'node' || type === 'model:node';
    }
    return name === this.name && (type === 'rootElement' || type === 'model:rootElement' ||
        // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
        type === 'element' || type === 'model:element');
};
