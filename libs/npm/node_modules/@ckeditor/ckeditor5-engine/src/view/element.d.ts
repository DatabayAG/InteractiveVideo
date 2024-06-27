/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/element
 */
import Node from './node.js';
import { type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import { type MatcherPattern } from './matcher.js';
import { type StyleValue } from './stylesmap.js';
import type Document from './document.js';
import type Item from './item.js';
/**
 * View element.
 *
 * The editing engine does not define a fixed semantics of its elements (it is "DTD-free").
 * This is why the type of the {@link module:engine/view/element~Element} need to
 * be defined by the feature developer. When creating an element you should use one of the following methods:
 *
 * * {@link module:engine/view/downcastwriter~DowncastWriter#createContainerElement `downcastWriter#createContainerElement()`}
 * in order to create a {@link module:engine/view/containerelement~ContainerElement},
 * * {@link module:engine/view/downcastwriter~DowncastWriter#createAttributeElement `downcastWriter#createAttributeElement()`}
 * in order to create a {@link module:engine/view/attributeelement~AttributeElement},
 * * {@link module:engine/view/downcastwriter~DowncastWriter#createEmptyElement `downcastWriter#createEmptyElement()`}
 * in order to create a {@link module:engine/view/emptyelement~EmptyElement}.
 * * {@link module:engine/view/downcastwriter~DowncastWriter#createUIElement `downcastWriter#createUIElement()`}
 * in order to create a {@link module:engine/view/uielement~UIElement}.
 * * {@link module:engine/view/downcastwriter~DowncastWriter#createEditableElement `downcastWriter#createEditableElement()`}
 * in order to create a {@link module:engine/view/editableelement~EditableElement}.
 *
 * Note that for view elements which are not created from the model, like elements from mutations, paste or
 * {@link module:engine/controller/datacontroller~DataController#set data.set} it is not possible to define the type of the element.
 * In such cases the {@link module:engine/view/upcastwriter~UpcastWriter#createElement `UpcastWriter#createElement()`} method
 * should be used to create generic view elements.
 */
export default class Element extends Node {
    /**
     * Name of the element.
     */
    readonly name: string;
    /**
     * A list of attribute names that should be rendered in the editing pipeline even though filtering mechanisms
     * implemented in the {@link module:engine/view/domconverter~DomConverter} (for instance,
     * {@link module:engine/view/domconverter~DomConverter#shouldRenderAttribute}) would filter them out.
     *
     * These attributes can be specified as an option when the element is created by
     * the {@link module:engine/view/downcastwriter~DowncastWriter}. To check whether an unsafe an attribute should
     * be permitted, use the {@link #shouldRenderUnsafeAttribute} method.
     *
     * @internal
     */
    readonly _unsafeAttributesToRender: Array<string>;
    /**
     * Map of attributes, where attributes names are keys and attributes values are values.
     */
    private readonly _attrs;
    /**
     * Array of child nodes.
     */
    private readonly _children;
    /**
     * Set of classes associated with element instance.
     */
    private readonly _classes;
    /**
     * Normalized styles.
     */
    private readonly _styles;
    /**
     * Map of custom properties.
     * Custom properties can be added to element instance, will be cloned but not rendered into DOM.
     */
    private readonly _customProperties;
    /**
     * Creates a view element.
     *
     * Attributes can be passed in various formats:
     *
     * ```ts
     * new Element( viewDocument, 'div', { class: 'editor', contentEditable: 'true' } ); // object
     * new Element( viewDocument, 'div', [ [ 'class', 'editor' ], [ 'contentEditable', 'true' ] ] ); // map-like iterator
     * new Element( viewDocument, 'div', mapOfAttributes ); // map
     * ```
     *
     * @internal
     * @param document The document instance to which this element belongs.
     * @param name Node name.
     * @param attrs Collection of attributes.
     * @param children A list of nodes to be inserted into created element.
     */
    constructor(document: Document, name: string, attrs?: ElementAttributes, children?: Node | Iterable<Node>);
    /**
     * Number of element's children.
     */
    get childCount(): number;
    /**
     * Is `true` if there are no nodes inside this element, `false` otherwise.
     */
    get isEmpty(): boolean;
    /**
     * Gets child at the given index.
     *
     * @param index Index of child.
     * @returns Child node.
     */
    getChild(index: number): Node | undefined;
    /**
     * Gets index of the given child node. Returns `-1` if child node is not found.
     *
     * @param node Child node.
     * @returns Index of the child node.
     */
    getChildIndex(node: Node): number;
    /**
     * Gets child nodes iterator.
     *
     * @returns Child nodes iterator.
     */
    getChildren(): IterableIterator<Node>;
    /**
     * Returns an iterator that contains the keys for attributes. Order of inserting attributes is not preserved.
     *
     * @returns Keys for attributes.
     */
    getAttributeKeys(): IterableIterator<string>;
    /**
     * Returns iterator that iterates over this element's attributes.
     *
     * Attributes are returned as arrays containing two items. First one is attribute key and second is attribute value.
     * This format is accepted by native `Map` object and also can be passed in `Node` constructor.
     */
    getAttributes(): IterableIterator<[string, string]>;
    /**
     * Gets attribute by key. If attribute is not present - returns undefined.
     *
     * @param key Attribute key.
     * @returns Attribute value.
     */
    getAttribute(key: string): string | undefined;
    /**
     * Returns a boolean indicating whether an attribute with the specified key exists in the element.
     *
     * @param key Attribute key.
     * @returns `true` if attribute with the specified key exists in the element, `false` otherwise.
     */
    hasAttribute(key: string): boolean;
    /**
     * Checks if this element is similar to other element.
     * Both elements should have the same name and attributes to be considered as similar. Two similar elements
     * can contain different set of children nodes.
     */
    isSimilar(otherElement: Item): boolean;
    /**
     * Returns true if class is present.
     * If more then one class is provided - returns true only when all classes are present.
     *
     * ```ts
     * element.hasClass( 'foo' ); // Returns true if 'foo' class is present.
     * element.hasClass( 'foo', 'bar' ); // Returns true if 'foo' and 'bar' classes are both present.
     * ```
     */
    hasClass(...className: Array<string>): boolean;
    /**
     * Returns iterator that contains all class names.
     */
    getClassNames(): Iterable<string>;
    /**
     * Returns style value for the given property mae.
     * If the style does not exist `undefined` is returned.
     *
     * **Note**: This method can work with normalized style names if
     * {@link module:engine/controller/datacontroller~DataController#addStyleProcessorRules a particular style processor rule is enabled}.
     * See {@link module:engine/view/stylesmap~StylesMap#getAsString `StylesMap#getAsString()`} for details.
     *
     * For an element with style set to `'margin:1px'`:
     *
     * ```ts
     * // Enable 'margin' shorthand processing:
     * editor.data.addStyleProcessorRules( addMarginRules );
     *
     * const element = view.change( writer => {
     * 	const element = writer.createElement();
     * 	writer.setStyle( 'margin', '1px' );
     * 	writer.setStyle( 'margin-bottom', '3em' );
     *
     * 	return element;
     * } );
     *
     * element.getStyle( 'margin' ); // -> 'margin: 1px 1px 3em;'
     * ```
     */
    getStyle(property: string): string | undefined;
    /**
     * Returns a normalized style object or single style value.
     *
     * For an element with style set to: margin:1px 2px 3em;
     *
     * ```ts
     * element.getNormalizedStyle( 'margin' ) );
     * ```
     *
     * will return:
     *
     * ```ts
     * {
     * 	top: '1px',
     * 	right: '2px',
     * 	bottom: '3em',
     * 	left: '2px'    // a normalized value from margin shorthand
     * }
     * ```
     *
     * and reading for single style value:
     *
     * ```ts
     * styles.getNormalizedStyle( 'margin-left' );
     * ```
     *
     * Will return a `2px` string.
     *
     * **Note**: This method will return normalized values only if
     * {@link module:engine/controller/datacontroller~DataController#addStyleProcessorRules a particular style processor rule is enabled}.
     * See {@link module:engine/view/stylesmap~StylesMap#getNormalized `StylesMap#getNormalized()`} for details.
     *
     * @param property Name of CSS property
     */
    getNormalizedStyle(property: string): StyleValue;
    /**
     * Returns iterator that contains all style names.
     *
     * @param expand Expand shorthand style properties and return all equivalent style representations.
     */
    getStyleNames(expand?: boolean): Iterable<string>;
    /**
     * Returns true if style keys are present.
     * If more then one style property is provided - returns true only when all properties are present.
     *
     * ```ts
     * element.hasStyle( 'color' ); // Returns true if 'border-top' style is present.
     * element.hasStyle( 'color', 'border-top' ); // Returns true if 'color' and 'border-top' styles are both present.
     * ```
     */
    hasStyle(...property: Array<string>): boolean;
    /**
     * Returns ancestor element that match specified pattern.
     * Provided patterns should be compatible with {@link module:engine/view/matcher~Matcher Matcher} as it is used internally.
     *
     * @see module:engine/view/matcher~Matcher
     * @param patterns Patterns used to match correct ancestor. See {@link module:engine/view/matcher~Matcher}.
     * @returns Found element or `null` if no matching ancestor was found.
     */
    findAncestor(...patterns: Array<MatcherPattern | ((element: Element) => boolean)>): Element | null;
    /**
     * Returns the custom property value for the given key.
     */
    getCustomProperty(key: string | symbol): unknown;
    /**
     * Returns an iterator which iterates over this element's custom properties.
     * Iterator provides `[ key, value ]` pairs for each stored property.
     */
    getCustomProperties(): IterableIterator<[string | symbol, unknown]>;
    /**
     * Returns identity string based on element's name, styles, classes and other attributes.
     * Two elements that {@link #isSimilar are similar} will have same identity string.
     * It has the following format:
     *
     * ```ts
     * 'name class="class1,class2" style="style1:value1;style2:value2" attr1="val1" attr2="val2"'
     * ```
     *
     * For example:
     *
     * ```ts
     * const element = writer.createContainerElement( 'foo', {
     * 	banana: '10',
     * 	apple: '20',
     * 	style: 'color: red; border-color: white;',
     * 	class: 'baz'
     * } );
     *
     * // returns 'foo class="baz" style="border-color:white;color:red" apple="20" banana="10"'
     * element.getIdentity();
     * ```
     *
     * **Note**: Classes, styles and other attributes are sorted alphabetically.
     */
    getIdentity(): string;
    /**
     * Decides whether an unsafe attribute is whitelisted and should be rendered in the editing pipeline even though filtering mechanisms
     * like {@link module:engine/view/domconverter~DomConverter#shouldRenderAttribute} say it should not.
     *
     * Unsafe attribute names can be specified when creating an element via {@link module:engine/view/downcastwriter~DowncastWriter}.
     *
     * @param attributeName The name of the attribute to be checked.
     */
    shouldRenderUnsafeAttribute(attributeName: string): boolean;
    /**
     * Clones provided element.
     *
     * @internal
     * @param deep If set to `true` clones element and all its children recursively. When set to `false`,
     * element will be cloned without any children.
     * @returns Clone of this element.
     */
    _clone(deep?: boolean): this;
    /**
     * {@link module:engine/view/element~Element#_insertChild Insert} a child node or a list of child nodes at the end of this node
     * and sets the parent of these nodes to this element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#insert
     * @internal
     * @param items Items to be inserted.
     * @fires change
     * @returns Number of appended nodes.
     */
    _appendChild(items: Item | string | Iterable<Item | string>): number;
    /**
     * Inserts a child node or a list of child nodes on the given index and sets the parent of these nodes to
     * this element.
     *
     * @internal
     * @see module:engine/view/downcastwriter~DowncastWriter#insert
     * @param index Position where nodes should be inserted.
     * @param items Items to be inserted.
     * @fires change
     * @returns Number of inserted nodes.
     */
    _insertChild(index: number, items: Item | string | Iterable<Item | string>): number;
    /**
     * Removes number of child nodes starting at the given index and set the parent of these nodes to `null`.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#remove
     * @internal
     * @param index Number of the first node to remove.
     * @param howMany Number of nodes to remove.
     * @fires change
     * @returns The array of removed nodes.
     */
    _removeChildren(index: number, howMany?: number): Array<Node>;
    /**
     * Adds or overwrite attribute with a specified key and value.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setAttribute
     * @internal
     * @param key Attribute key.
     * @param value Attribute value.
     * @fires change
     */
    _setAttribute(key: string, value: unknown): void;
    /**
     * Removes attribute from the element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeAttribute
     * @internal
     * @param key Attribute key.
     * @returns Returns true if an attribute existed and has been removed.
     * @fires change
     */
    _removeAttribute(key: string): boolean;
    /**
     * Adds specified class.
     *
     * ```ts
     * element._addClass( 'foo' ); // Adds 'foo' class.
     * element._addClass( [ 'foo', 'bar' ] ); // Adds 'foo' and 'bar' classes.
     * ```
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#addClass
     * @internal
     * @fires change
     */
    _addClass(className: ArrayOrItem<string>): void;
    /**
     * Removes specified class.
     *
     * ```ts
     * element._removeClass( 'foo' );  // Removes 'foo' class.
     * element._removeClass( [ 'foo', 'bar' ] ); // Removes both 'foo' and 'bar' classes.
     * ```
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeClass
     * @internal
     * @fires change
     */
    _removeClass(className: ArrayOrItem<string>): void;
    /**
     * Adds style to the element.
     *
     * ```ts
     * element._setStyle( 'color', 'red' );
     * ```
     *
     * **Note**: This method can work with normalized style names if
     * {@link module:engine/controller/datacontroller~DataController#addStyleProcessorRules a particular style processor rule is enabled}.
     * See {@link module:engine/view/stylesmap~StylesMap#set `StylesMap#set()`} for details.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setStyle
     * @label KEY_VALUE
     * @internal
     * @param property Property name.
     * @param value Value to set.
     * @fires change
     */
    _setStyle(property: string, value: string): void;
    /**
     * Adds style to the element.
     *
     * ```ts
     * element._setStyle( {
     * 	color: 'red',
     * 	position: 'fixed'
     * } );
     * ```
     *
     * **Note**: This method can work with normalized style names if
     * {@link module:engine/controller/datacontroller~DataController#addStyleProcessorRules a particular style processor rule is enabled}.
     * See {@link module:engine/view/stylesmap~StylesMap#set `StylesMap#set()`} for details.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setStyle
     * @label OBJECT
     * @internal
     * @param properties Object with key - value pairs.
     * @fires change
     */
    _setStyle(properties: Record<string, string>): void;
    /**
     * Removes specified style.
     *
     * ```ts
     * element._removeStyle( 'color' );  // Removes 'color' style.
     * element._removeStyle( [ 'color', 'border-top' ] ); // Removes both 'color' and 'border-top' styles.
     * ```
     *
     * **Note**: This method can work with normalized style names if
     * {@link module:engine/controller/datacontroller~DataController#addStyleProcessorRules a particular style processor rule is enabled}.
     * See {@link module:engine/view/stylesmap~StylesMap#remove `StylesMap#remove()`} for details.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeStyle
     * @internal
     * @fires change
     */
    _removeStyle(property: ArrayOrItem<string>): void;
    /**
     * Sets a custom property. Unlike attributes, custom properties are not rendered to the DOM,
     * so they can be used to add special data to elements.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setCustomProperty
     * @internal
     */
    _setCustomProperty(key: string | symbol, value: unknown): void;
    /**
     * Removes the custom property stored under the given key.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeCustomProperty
     * @internal
     * @returns Returns true if property was removed.
     */
    _removeCustomProperty(key: string | symbol): boolean;
    /**
     * Returns block {@link module:engine/view/filler filler} offset or `null` if block filler is not needed.
     */
    getFillerOffset?(): number | null;
}
/**
 * Collection of attributes.
 */
export type ElementAttributes = Record<string, unknown> | Iterable<[string, unknown]> | null;
