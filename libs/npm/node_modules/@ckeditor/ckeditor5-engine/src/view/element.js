/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/element
 */
import Node from './node.js';
import Text from './text.js';
import TextProxy from './textproxy.js';
import { isIterable, toArray, toMap } from '@ckeditor/ckeditor5-utils';
import { default as Matcher } from './matcher.js';
import { default as StylesMap } from './stylesmap.js';
// @if CK_DEBUG_ENGINE // const { convertMapToTags } = require( '../dev-utils/utils' );
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
    constructor(document, name, attrs, children) {
        super(document);
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
        this._unsafeAttributesToRender = [];
        /**
         * Map of custom properties.
         * Custom properties can be added to element instance, will be cloned but not rendered into DOM.
         */
        this._customProperties = new Map();
        this.name = name;
        this._attrs = parseAttributes(attrs);
        this._children = [];
        if (children) {
            this._insertChild(0, children);
        }
        this._classes = new Set();
        if (this._attrs.has('class')) {
            // Remove class attribute and handle it by class set.
            const classString = this._attrs.get('class');
            parseClasses(this._classes, classString);
            this._attrs.delete('class');
        }
        this._styles = new StylesMap(this.document.stylesProcessor);
        if (this._attrs.has('style')) {
            // Remove style attribute and handle it by styles map.
            this._styles.setTo(this._attrs.get('style'));
            this._attrs.delete('style');
        }
    }
    /**
     * Number of element's children.
     */
    get childCount() {
        return this._children.length;
    }
    /**
     * Is `true` if there are no nodes inside this element, `false` otherwise.
     */
    get isEmpty() {
        return this._children.length === 0;
    }
    /**
     * Gets child at the given index.
     *
     * @param index Index of child.
     * @returns Child node.
     */
    getChild(index) {
        return this._children[index];
    }
    /**
     * Gets index of the given child node. Returns `-1` if child node is not found.
     *
     * @param node Child node.
     * @returns Index of the child node.
     */
    getChildIndex(node) {
        return this._children.indexOf(node);
    }
    /**
     * Gets child nodes iterator.
     *
     * @returns Child nodes iterator.
     */
    getChildren() {
        return this._children[Symbol.iterator]();
    }
    /**
     * Returns an iterator that contains the keys for attributes. Order of inserting attributes is not preserved.
     *
     * @returns Keys for attributes.
     */
    *getAttributeKeys() {
        if (this._classes.size > 0) {
            yield 'class';
        }
        if (!this._styles.isEmpty) {
            yield 'style';
        }
        yield* this._attrs.keys();
    }
    /**
     * Returns iterator that iterates over this element's attributes.
     *
     * Attributes are returned as arrays containing two items. First one is attribute key and second is attribute value.
     * This format is accepted by native `Map` object and also can be passed in `Node` constructor.
     */
    *getAttributes() {
        yield* this._attrs.entries();
        if (this._classes.size > 0) {
            yield ['class', this.getAttribute('class')];
        }
        if (!this._styles.isEmpty) {
            yield ['style', this.getAttribute('style')];
        }
    }
    /**
     * Gets attribute by key. If attribute is not present - returns undefined.
     *
     * @param key Attribute key.
     * @returns Attribute value.
     */
    getAttribute(key) {
        if (key == 'class') {
            if (this._classes.size > 0) {
                return [...this._classes].join(' ');
            }
            return undefined;
        }
        if (key == 'style') {
            const inlineStyle = this._styles.toString();
            return inlineStyle == '' ? undefined : inlineStyle;
        }
        return this._attrs.get(key);
    }
    /**
     * Returns a boolean indicating whether an attribute with the specified key exists in the element.
     *
     * @param key Attribute key.
     * @returns `true` if attribute with the specified key exists in the element, `false` otherwise.
     */
    hasAttribute(key) {
        if (key == 'class') {
            return this._classes.size > 0;
        }
        if (key == 'style') {
            return !this._styles.isEmpty;
        }
        return this._attrs.has(key);
    }
    /**
     * Checks if this element is similar to other element.
     * Both elements should have the same name and attributes to be considered as similar. Two similar elements
     * can contain different set of children nodes.
     */
    isSimilar(otherElement) {
        if (!(otherElement instanceof Element)) {
            return false;
        }
        // If exactly the same Element is provided - return true immediately.
        if (this === otherElement) {
            return true;
        }
        // Check element name.
        if (this.name != otherElement.name) {
            return false;
        }
        // Check number of attributes, classes and styles.
        if (this._attrs.size !== otherElement._attrs.size || this._classes.size !== otherElement._classes.size ||
            this._styles.size !== otherElement._styles.size) {
            return false;
        }
        // Check if attributes are the same.
        for (const [key, value] of this._attrs) {
            if (!otherElement._attrs.has(key) || otherElement._attrs.get(key) !== value) {
                return false;
            }
        }
        // Check if classes are the same.
        for (const className of this._classes) {
            if (!otherElement._classes.has(className)) {
                return false;
            }
        }
        // Check if styles are the same.
        for (const property of this._styles.getStyleNames()) {
            if (!otherElement._styles.has(property) ||
                otherElement._styles.getAsString(property) !== this._styles.getAsString(property)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns true if class is present.
     * If more then one class is provided - returns true only when all classes are present.
     *
     * ```ts
     * element.hasClass( 'foo' ); // Returns true if 'foo' class is present.
     * element.hasClass( 'foo', 'bar' ); // Returns true if 'foo' and 'bar' classes are both present.
     * ```
     */
    hasClass(...className) {
        for (const name of className) {
            if (!this._classes.has(name)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns iterator that contains all class names.
     */
    getClassNames() {
        return this._classes.keys();
    }
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
    getStyle(property) {
        return this._styles.getAsString(property);
    }
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
    getNormalizedStyle(property) {
        return this._styles.getNormalized(property);
    }
    /**
     * Returns iterator that contains all style names.
     *
     * @param expand Expand shorthand style properties and return all equivalent style representations.
     */
    getStyleNames(expand) {
        return this._styles.getStyleNames(expand);
    }
    /**
     * Returns true if style keys are present.
     * If more then one style property is provided - returns true only when all properties are present.
     *
     * ```ts
     * element.hasStyle( 'color' ); // Returns true if 'border-top' style is present.
     * element.hasStyle( 'color', 'border-top' ); // Returns true if 'color' and 'border-top' styles are both present.
     * ```
     */
    hasStyle(...property) {
        for (const name of property) {
            if (!this._styles.has(name)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns ancestor element that match specified pattern.
     * Provided patterns should be compatible with {@link module:engine/view/matcher~Matcher Matcher} as it is used internally.
     *
     * @see module:engine/view/matcher~Matcher
     * @param patterns Patterns used to match correct ancestor. See {@link module:engine/view/matcher~Matcher}.
     * @returns Found element or `null` if no matching ancestor was found.
     */
    findAncestor(...patterns) {
        const matcher = new Matcher(...patterns);
        let parent = this.parent;
        while (parent && !parent.is('documentFragment')) {
            if (matcher.match(parent)) {
                return parent;
            }
            parent = parent.parent;
        }
        return null;
    }
    /**
     * Returns the custom property value for the given key.
     */
    getCustomProperty(key) {
        return this._customProperties.get(key);
    }
    /**
     * Returns an iterator which iterates over this element's custom properties.
     * Iterator provides `[ key, value ]` pairs for each stored property.
     */
    *getCustomProperties() {
        yield* this._customProperties.entries();
    }
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
    getIdentity() {
        const classes = Array.from(this._classes).sort().join(',');
        const styles = this._styles.toString();
        const attributes = Array.from(this._attrs).map(i => `${i[0]}="${i[1]}"`).sort().join(' ');
        return this.name +
            (classes == '' ? '' : ` class="${classes}"`) +
            (!styles ? '' : ` style="${styles}"`) +
            (attributes == '' ? '' : ` ${attributes}`);
    }
    /**
     * Decides whether an unsafe attribute is whitelisted and should be rendered in the editing pipeline even though filtering mechanisms
     * like {@link module:engine/view/domconverter~DomConverter#shouldRenderAttribute} say it should not.
     *
     * Unsafe attribute names can be specified when creating an element via {@link module:engine/view/downcastwriter~DowncastWriter}.
     *
     * @param attributeName The name of the attribute to be checked.
     */
    shouldRenderUnsafeAttribute(attributeName) {
        return this._unsafeAttributesToRender.includes(attributeName);
    }
    /**
     * Clones provided element.
     *
     * @internal
     * @param deep If set to `true` clones element and all its children recursively. When set to `false`,
     * element will be cloned without any children.
     * @returns Clone of this element.
     */
    _clone(deep = false) {
        const childrenClone = [];
        if (deep) {
            for (const child of this.getChildren()) {
                childrenClone.push(child._clone(deep));
            }
        }
        // ContainerElement and AttributeElement should be also cloned properly.
        const cloned = new this.constructor(this.document, this.name, this._attrs, childrenClone);
        // Classes and styles are cloned separately - this solution is faster than adding them back to attributes and
        // parse once again in constructor.
        cloned._classes = new Set(this._classes);
        cloned._styles.set(this._styles.getNormalized());
        // Clone custom properties.
        cloned._customProperties = new Map(this._customProperties);
        // Clone filler offset method.
        // We can't define this method in a prototype because it's behavior which
        // is changed by e.g. toWidget() function from ckeditor5-widget. Perhaps this should be one of custom props.
        cloned.getFillerOffset = this.getFillerOffset;
        // Clone unsafe attributes list.
        cloned._unsafeAttributesToRender = this._unsafeAttributesToRender;
        return cloned;
    }
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
    _appendChild(items) {
        return this._insertChild(this.childCount, items);
    }
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
    _insertChild(index, items) {
        this._fireChange('children', this);
        let count = 0;
        const nodes = normalize(this.document, items);
        for (const node of nodes) {
            // If node that is being added to this element is already inside another element, first remove it from the old parent.
            if (node.parent !== null) {
                node._remove();
            }
            node.parent = this;
            node.document = this.document;
            this._children.splice(index, 0, node);
            index++;
            count++;
        }
        return count;
    }
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
    _removeChildren(index, howMany = 1) {
        this._fireChange('children', this);
        for (let i = index; i < index + howMany; i++) {
            this._children[i].parent = null;
        }
        return this._children.splice(index, howMany);
    }
    /**
     * Adds or overwrite attribute with a specified key and value.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setAttribute
     * @internal
     * @param key Attribute key.
     * @param value Attribute value.
     * @fires change
     */
    _setAttribute(key, value) {
        const stringValue = String(value);
        this._fireChange('attributes', this);
        if (key == 'class') {
            parseClasses(this._classes, stringValue);
        }
        else if (key == 'style') {
            this._styles.setTo(stringValue);
        }
        else {
            this._attrs.set(key, stringValue);
        }
    }
    /**
     * Removes attribute from the element.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeAttribute
     * @internal
     * @param key Attribute key.
     * @returns Returns true if an attribute existed and has been removed.
     * @fires change
     */
    _removeAttribute(key) {
        this._fireChange('attributes', this);
        // Remove class attribute.
        if (key == 'class') {
            if (this._classes.size > 0) {
                this._classes.clear();
                return true;
            }
            return false;
        }
        // Remove style attribute.
        if (key == 'style') {
            if (!this._styles.isEmpty) {
                this._styles.clear();
                return true;
            }
            return false;
        }
        // Remove other attributes.
        return this._attrs.delete(key);
    }
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
    _addClass(className) {
        this._fireChange('attributes', this);
        for (const name of toArray(className)) {
            this._classes.add(name);
        }
    }
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
    _removeClass(className) {
        this._fireChange('attributes', this);
        for (const name of toArray(className)) {
            this._classes.delete(name);
        }
    }
    _setStyle(property, value) {
        this._fireChange('attributes', this);
        if (typeof property != 'string') {
            this._styles.set(property);
        }
        else {
            this._styles.set(property, value);
        }
    }
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
    _removeStyle(property) {
        this._fireChange('attributes', this);
        for (const name of toArray(property)) {
            this._styles.remove(name);
        }
    }
    /**
     * Sets a custom property. Unlike attributes, custom properties are not rendered to the DOM,
     * so they can be used to add special data to elements.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#setCustomProperty
     * @internal
     */
    _setCustomProperty(key, value) {
        this._customProperties.set(key, value);
    }
    /**
     * Removes the custom property stored under the given key.
     *
     * @see module:engine/view/downcastwriter~DowncastWriter#removeCustomProperty
     * @internal
     * @returns Returns true if property was removed.
     */
    _removeCustomProperty(key) {
        return this._customProperties.delete(key);
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
Element.prototype.is = function (type, name) {
    if (!name) {
        return type === 'element' || type === 'view:element' ||
            // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
            type === 'node' || type === 'view:node';
    }
    else {
        return name === this.name && (type === 'element' || type === 'view:element');
    }
};
/**
 * Parses attributes provided to the element constructor before they are applied to an element. If attributes are passed
 * as an object (instead of `Iterable`), the object is transformed to the map. Attributes with `null` value are removed.
 * Attributes with non-`String` value are converted to `String`.
 *
 * @param attrs Attributes to parse.
 * @returns Parsed attributes.
 */
function parseAttributes(attrs) {
    const attrsMap = toMap(attrs);
    for (const [key, value] of attrsMap) {
        if (value === null) {
            attrsMap.delete(key);
        }
        else if (typeof value != 'string') {
            attrsMap.set(key, String(value));
        }
    }
    return attrsMap;
}
/**
 * Parses class attribute and puts all classes into classes set.
 * Classes set s cleared before insertion.
 *
 * @param classesSet Set to insert parsed classes.
 * @param classesString String with classes to parse.
 */
function parseClasses(classesSet, classesString) {
    const classArray = classesString.split(/\s+/);
    classesSet.clear();
    classArray.forEach(name => classesSet.add(name));
}
/**
 * Converts strings to Text and non-iterables to arrays.
 */
function normalize(document, nodes) {
    // Separate condition because string is iterable.
    if (typeof nodes == 'string') {
        return [new Text(document, nodes)];
    }
    if (!isIterable(nodes)) {
        nodes = [nodes];
    }
    // Array.from to enable .map() on non-arrays.
    return Array.from(nodes)
        .map(node => {
        if (typeof node == 'string') {
            return new Text(document, node);
        }
        if (node instanceof TextProxy) {
            return new Text(document, node.data);
        }
        return node;
    });
}
