/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/attributeelement
 */
import Element, { type ElementAttributes } from './element.js';
import type Document from './document.js';
import type Node from './node.js';
/**
 * Attribute elements are used to represent formatting elements in the view (think – `<b>`, `<span style="font-size: 2em">`, etc.).
 * Most often they are created when downcasting model text attributes.
 *
 * Editing engine does not define a fixed HTML DTD. This is why a feature developer needs to choose between various
 * types (container element, {@link module:engine/view/attributeelement~AttributeElement attribute element},
 * {@link module:engine/view/emptyelement~EmptyElement empty element}, etc) when developing a feature.
 *
 * To create a new attribute element instance use the
 * {@link module:engine/view/downcastwriter~DowncastWriter#createAttributeElement `DowncastWriter#createAttributeElement()`} method.
 */
export default class AttributeElement extends Element {
    static readonly DEFAULT_PRIORITY: number;
    /**
     * Element priority. Decides in what order elements are wrapped by {@link module:engine/view/downcastwriter~DowncastWriter}.
     *
     * @internal
     * @readonly
     */
    _priority: number;
    /**
     * Element identifier. If set, it is used by {@link module:engine/view/element~Element#isSimilar},
     * and then two elements are considered similar if, and only if they have the same `_id`.
     *
     * @internal
     * @readonly
     */
    _id: string | number | null;
    /**
     * Keeps all the attribute elements that have the same {@link module:engine/view/attributeelement~AttributeElement#id ids}
     * and still exist in the view tree.
     *
     * This property is managed by {@link module:engine/view/downcastwriter~DowncastWriter}.
     */
    private readonly _clonesGroup;
    /**
     * Creates an attribute element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#createAttributeElement
     * @see module:engine/view/element~Element
     * @protected
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document: Document, name: string, attrs?: ElementAttributes, children?: Node | Iterable<Node>);
    /**
     * Element priority. Decides in what order elements are wrapped by {@link module:engine/view/downcastwriter~DowncastWriter}.
     */
    get priority(): number;
    /**
     * Element identifier. If set, it is used by {@link module:engine/view/element~Element#isSimilar},
     * and then two elements are considered similar if, and only if they have the same `id`.
     */
    get id(): string | number | null;
    /**
     * Returns all {@link module:engine/view/attributeelement~AttributeElement attribute elements} that has the
     * same {@link module:engine/view/attributeelement~AttributeElement#id id} and are in the view tree (were not removed).
     *
     * Note: If this element has been removed from the tree, returned set will not include it.
     *
     * Throws {@link module:utils/ckeditorerror~CKEditorError attribute-element-get-elements-with-same-id-no-id}
     * if this element has no `id`.
     *
     * @returns Set containing all the attribute elements
     * with the same `id` that were added and not removed from the view tree.
     */
    getElementsWithSameId(): Set<AttributeElement>;
    /**
     * Checks if this element is similar to other element.
     *
     * If none of elements has set {@link module:engine/view/attributeelement~AttributeElement#id}, then both elements
     * should have the same name, attributes and priority to be considered as similar. Two similar elements can contain
     * different set of children nodes.
     *
     * If at least one element has {@link module:engine/view/attributeelement~AttributeElement#id} set, then both
     * elements have to have the same {@link module:engine/view/attributeelement~AttributeElement#id} value to be
     * considered similar.
     *
     * Similarity is important for {@link module:engine/view/downcastwriter~DowncastWriter}. For example:
     *
     * * two following similar elements can be merged together into one, longer element,
     * * {@link module:engine/view/downcastwriter~DowncastWriter#unwrap} checks similarity of passed element and processed element to
     * decide whether processed element should be unwrapped,
     * * etc.
     */
    isSimilar(otherElement: Element): boolean;
    /**
     * Clones provided element with priority.
     *
     * @internal
     * @param deep If set to `true` clones element and all its children recursively. When set to `false`,
     * element will be cloned without any children.
     * @returns Clone of this element.
     */
    _clone(deep?: boolean): this;
}
