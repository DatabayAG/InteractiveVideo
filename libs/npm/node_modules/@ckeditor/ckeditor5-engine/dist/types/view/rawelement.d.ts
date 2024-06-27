/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/rawelement
 */
import Element, { type ElementAttributes } from './element.js';
import Node from './node.js';
import type Document from './document.js';
import type DomConverter from './domconverter.js';
import type Item from './item.js';
type DomElement = globalThis.HTMLElement;
/**
 * The raw element class.
 *
 * The raw elements work as data containers ("wrappers", "sandboxes") but their children are not managed or
 * even recognized by the editor. This encapsulation allows integrations to maintain custom DOM structures
 * in the editor content without, for instance, worrying about compatibility with other editor features.
 * Raw elements are a perfect tool for integration with external frameworks and data sources.
 *
 * Unlike {@link module:engine/view/uielement~UIElement UI elements}, raw elements act like real editor
 * content (similar to {@link module:engine/view/containerelement~ContainerElement} or
 * {@link module:engine/view/emptyelement~EmptyElement}), they are considered by the editor selection and
 * {@link module:widget/utils~toWidget they can work as widgets}.
 *
 * To create a new raw element, use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createRawElement `downcastWriter#createRawElement()`} method.
 */
export default class RawElement extends Element {
    /**
     * Creates a new instance of a raw element.
     *
     * Throws the `view-rawelement-cannot-add` {@link module:utils/ckeditorerror~CKEditorError CKEditorError} when the `children`
     * parameter is passed to inform that the usage of `RawElement` is incorrect (adding child nodes to `RawElement` is forbidden).
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#createRawElement
     * @internal
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document: Document, name: string, attrs?: ElementAttributes, children?: Node | Iterable<Node>);
    /**
     * Overrides the {@link module:engine/view/element~Element#_insertChild} method.
     * Throws the `view-rawelement-cannot-add` {@link module:utils/ckeditorerror~CKEditorError CKEditorError} to prevent
     * adding any child nodes to a raw element.
     *
     * @internal
     */
    _insertChild(index: number, items: Item | Iterable<Item>): number;
    /**
     * This allows rendering the children of a {@link module:engine/view/rawelement~RawElement} on the DOM level.
     * This method is called by the {@link module:engine/view/domconverter~DomConverter} with the raw DOM element
     * passed as an argument, leaving the number and shape of the children up to the integrator.
     *
     * This method **must be defined** for the raw element to work:
     *
     * ```ts
     * const myRawElement = downcastWriter.createRawElement( 'div' );
     *
     * myRawElement.render = function( domElement, domConverter ) {
     * 	domConverter.setContentOf( domElement, '<b>This is the raw content of myRawElement.</b>' );
     * };
     * ```
     *
     * @param domElement The native DOM element representing the raw view element.
     * @param domConverter Instance of the DomConverter used to optimize the output.
     */
    render(domElement: DomElement, domConverter: DomConverter): void;
}
export {};
