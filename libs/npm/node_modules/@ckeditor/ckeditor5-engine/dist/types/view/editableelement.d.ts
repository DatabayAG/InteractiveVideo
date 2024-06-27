/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/editableelement
 */
import ContainerElement from './containerelement.js';
import type { ElementAttributes } from './element.js';
import type Document from './document.js';
import type Node from './node.js';
declare const EditableElement_base: import("@ckeditor/ckeditor5-utils").Mixed<typeof ContainerElement, import("@ckeditor/ckeditor5-utils").Observable>;
/**
 * Editable element which can be a {@link module:engine/view/rooteditableelement~RootEditableElement root}
 * or nested editable area in the editor.
 *
 * Editable is automatically read-only when its {@link module:engine/view/document~Document Document} is read-only.
 *
 * The constructor of this class shouldn't be used directly. To create new `EditableElement` use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createEditableElement `downcastWriter#createEditableElement()`} method.
 */
export default class EditableElement extends /* #__PURE__ */ EditableElement_base {
    /**
     * Whether the editable is in read-write or read-only mode.
     *
     * @observable
     */
    isReadOnly: boolean;
    /**
     * Whether the editable is focused.
     *
     * This property updates when {@link module:engine/view/document~Document#isFocused document.isFocused} or view
     * selection is changed.
     *
     * @readonly
     * @observable
     */
    isFocused: boolean;
    /**
     * Placeholder of editable element.
     *
     * ```ts
     * editor.editing.view.document.getRoot( 'main' ).placeholder = 'New placeholder';
     * ```
     *
     * @observable
     */
    placeholder?: string;
    /**
     * Creates an editable element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#createEditableElement
     * @internal
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document: Document, name: string, attributes?: ElementAttributes, children?: Node | Iterable<Node>);
    destroy(): void;
}
export {};
