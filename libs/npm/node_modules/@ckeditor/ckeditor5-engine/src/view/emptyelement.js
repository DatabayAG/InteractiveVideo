/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/emptyelement
 */
import Element from './element.js';
import Node from './node.js';
import { CKEditorError } from '@ckeditor/ckeditor5-utils';
/**
 * Empty element class. It is used to represent elements that cannot contain any child nodes (for example `<img>` elements).
 *
 * To create a new empty element use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createEmptyElement `downcastWriter#createEmptyElement()`} method.
 */
export default class EmptyElement extends Element {
    /**
     * Creates new instance of EmptyElement.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-emptyelement-cannot-add` when third parameter is passed,
     * to inform that usage of EmptyElement is incorrect (adding child nodes to EmptyElement is forbidden).
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#createEmptyElement
     * @internal
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document, name, attributes, children) {
        super(document, name, attributes, children);
        this.getFillerOffset = getFillerOffset;
    }
    /**
     * Overrides {@link module:engine/view/element~Element#_insertChild} method.
     * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-emptyelement-cannot-add` to prevent
     * adding any child nodes to EmptyElement.
     *
     * @internal
     */
    _insertChild(index, items) {
        if (items && (items instanceof Node || Array.from(items).length > 0)) {
            /**
             * Cannot add children to {@link module:engine/view/emptyelement~EmptyElement}.
             *
             * @error view-emptyelement-cannot-add
             */
            throw new CKEditorError('view-emptyelement-cannot-add', [this, items]);
        }
        return 0;
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
EmptyElement.prototype.is = function (type, name) {
    if (!name) {
        return type === 'emptyElement' || type === 'view:emptyElement' ||
            // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
            type === 'element' || type === 'view:element' ||
            type === 'node' || type === 'view:node';
    }
    else {
        return name === this.name && (type === 'emptyElement' || type === 'view:emptyElement' ||
            type === 'element' || type === 'view:element');
    }
};
/**
 * Returns `null` because block filler is not needed for EmptyElements.
 */
function getFillerOffset() {
    return null;
}
