/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/containerelement
 */
import Element, { type ElementAttributes } from './element.js';
import type Document from './document.js';
import type Node from './node.js';
/**
 * Containers are elements which define document structure. They define boundaries for
 * {@link module:engine/view/attributeelement~AttributeElement attributes}. They are mostly used for block elements like `<p>` or `<div>`.
 *
 * Editing engine does not define a fixed HTML DTD. This is why a feature developer needs to choose between various
 * types (container element, {@link module:engine/view/attributeelement~AttributeElement attribute element},
 * {@link module:engine/view/emptyelement~EmptyElement empty element}, etc) when developing a feature.
 *
 * The container element should be your default choice when writing a converter, unless:
 *
 * * this element represents a model text attribute (then use {@link module:engine/view/attributeelement~AttributeElement}),
 * * this is an empty element like `<img>` (then use {@link module:engine/view/emptyelement~EmptyElement}),
 * * this is a root element,
 * * this is a nested editable element (then use  {@link module:engine/view/editableelement~EditableElement}).
 *
 * To create a new container element instance use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createContainerElement `DowncastWriter#createContainerElement()`}
 * method.
 */
export default class ContainerElement extends Element {
    /**
     * Creates a container element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#createContainerElement
     * @see module:engine/view/element~Element
     * @internal
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document: Document, name: string, attrs?: ElementAttributes, children?: Node | Iterable<Node>);
}
/**
 * Returns block {@link module:engine/view/filler filler} offset or `null` if block filler is not needed.
 *
 * @returns Block filler offset or `null` if block filler is not needed.
 */
export declare function getFillerOffset(this: ContainerElement): number | null;
