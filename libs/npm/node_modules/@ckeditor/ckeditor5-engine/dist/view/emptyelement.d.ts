/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/emptyelement
 */
import Element, { type ElementAttributes } from './element.js';
import Node from './node.js';
import type Document from './document.js';
import type Item from './item.js';
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
    constructor(document: Document, name: string, attributes?: ElementAttributes, children?: Node | Iterable<Node>);
    /**
     * Overrides {@link module:engine/view/element~Element#_insertChild} method.
     * Throws {@link module:utils/ckeditorerror~CKEditorError CKEditorError} `view-emptyelement-cannot-add` to prevent
     * adding any child nodes to EmptyElement.
     *
     * @internal
     */
    _insertChild(index: number, items: Item | Iterable<Item>): number;
}
