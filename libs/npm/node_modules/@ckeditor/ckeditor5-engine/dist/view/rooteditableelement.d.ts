/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/rooteditableelement
 */
import EditableElement from './editableelement.js';
import type Document from './document.js';
/**
 * Class representing a single root in the data view. A root can be either {@link ~RootEditableElement#isReadOnly editable or read-only},
 * but in both cases it is called "an editable". Roots can contain other {@link module:engine/view/editableelement~EditableElement
 * editable elements} making them "nested editables".
 */
export default class RootEditableElement extends EditableElement {
    /**
     * Creates root editable element.
     *
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     */
    constructor(document: Document, name: string);
    /**
     * Name of this root inside {@link module:engine/view/document~Document} that is an owner of this root. If no
     * other name is set, `main` name is used.
     *
     * @readonly
     */
    get rootName(): string;
    set rootName(rootName: string);
    /**
     * Overrides old element name and sets new one.
     * This is needed because view roots are created before they are attached to the DOM.
     * The name of the root element is temporary at this stage. It has to be changed when the
     * view root element is attached to the DOM element.
     *
     * @internal
     * @param name The new name of element.
     */
    set _name(name: string);
}
