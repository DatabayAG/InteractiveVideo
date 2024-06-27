/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Collection, CKEditorError, EmitterMixin, isNode, toArray, DomEmitterMixin, ObservableMixin, isIterable, uid, env, delay, getEnvKeystrokeText, isVisible, global, KeystrokeHandler, FocusTracker, Rect, toUnit, createElement, ResizeObserver, getBorderWidths, logWarning, getOptimalPosition, priorities, isRange, first, verifyLicense } from '@ckeditor/ckeditor5-utils/dist/index.js';
import { cloneDeepWith, isObject, debounce, isElement, throttle, extend, escapeRegExp, escape, cloneDeep } from 'lodash-es';
import { icons, Plugin, ContextPlugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import parse from 'color-parse';
import * as convert from 'color-convert';
import { HexBase } from 'vanilla-colorful/lib/entrypoints/hex';

/**
 * Collects {@link module:ui/view~View} instances.
 *
 * ```ts
 * const parentView = new ParentView( locale );
 * const collection = new ViewCollection( locale );
 *
 * collection.setParent( parentView.element );
 *
 * const viewA = new ChildView( locale );
 * const viewB = new ChildView( locale );
 * ```
 *
 * View collection renders and manages view {@link module:ui/view~View#element elements}:
 *
 * ```ts
 * collection.add( viewA );
 * collection.add( viewB );
 *
 * console.log( parentView.element.firsChild ); // -> viewA.element
 * console.log( parentView.element.lastChild ); // -> viewB.element
 * ```
 *
 * It {@link module:ui/viewcollection~ViewCollection#delegate propagates} DOM events too:
 *
 * ```ts
 * // Delegate #click and #keydown events from viewA and viewB to the parentView.
 * collection.delegate( 'click' ).to( parentView );
 *
 * parentView.on( 'click', ( evt ) => {
 * 	console.log( `${ evt.source } has been clicked.` );
 * } );
 *
 * // This event will be delegated to the parentView.
 * viewB.fire( 'click' );
 * ```
 *
 * **Note**: A view collection can be used directly in the {@link module:ui/template~TemplateDefinition definition}
 * of a {@link module:ui/template~Template template}.
 */ class ViewCollection extends Collection {
    /**
	 * A parent element within which child views are rendered and managed in DOM.
	 */ _parentElement;
    /**
	 * Creates a new instance of the {@link module:ui/viewcollection~ViewCollection}.
	 *
	 * @param initialItems The initial items of the collection.
	 */ constructor(initialItems = []){
        super(initialItems, {
            // An #id Number attribute should be legal and not break the `ViewCollection` instance.
            // https://github.com/ckeditor/ckeditor5-ui/issues/93
            idProperty: 'viewUid'
        });
        // Handle {@link module:ui/view~View#element} in DOM when a new view is added to the collection.
        this.on('add', (evt, view, index)=>{
            this._renderViewIntoCollectionParent(view, index);
        });
        // Handle {@link module:ui/view~View#element} in DOM when a view is removed from the collection.
        this.on('remove', (evt, view)=>{
            if (view.element && this._parentElement) {
                view.element.remove();
            }
        });
        this._parentElement = null;
    }
    /**
	 * Destroys the view collection along with child views.
	 * See the view {@link module:ui/view~View#destroy} method.
	 */ destroy() {
        this.map((view)=>view.destroy());
    }
    /**
	 * Sets the parent HTML element of this collection. When parent is set, {@link #add adding} and
	 * {@link #remove removing} views in the collection synchronizes their
	 * {@link module:ui/view~View#element elements} in the parent element.
	 *
	 * @param element A new parent element.
	 */ setParent(elementOrDocFragment) {
        this._parentElement = elementOrDocFragment;
        // Take care of the initial collection items passed to the constructor.
        for (const view of this){
            this._renderViewIntoCollectionParent(view);
        }
    }
    /**
	 * Delegates selected events coming from within views in the collection to any
	 * {@link module:utils/emittermixin~Emitter}.
	 *
	 * For the following views and collection:
	 *
	 * ```ts
	 * const viewA = new View();
	 * const viewB = new View();
	 * const viewC = new View();
	 *
	 * const views = parentView.createCollection();
	 *
	 * views.delegate( 'eventX' ).to( viewB );
	 * views.delegate( 'eventX', 'eventY' ).to( viewC );
	 *
	 * views.add( viewA );
	 * ```
	 *
	 * the `eventX` is delegated (fired by) `viewB` and `viewC` along with `customData`:
	 *
	 * ```ts
	 * viewA.fire( 'eventX', customData );
	 * ```
	 *
	 * and `eventY` is delegated (fired by) `viewC` along with `customData`:
	 *
	 * ```ts
	 * viewA.fire( 'eventY', customData );
	 * ```
	 *
	 * See {@link module:utils/emittermixin~Emitter#delegate}.
	 *
	 * @param events {@link module:ui/view~View} event names to be delegated to another
	 * {@link module:utils/emittermixin~Emitter}.
	 * @returns Object with `to` property, a function which accepts the destination
	 * of {@link module:utils/emittermixin~Emitter#delegate delegated} events.
	 */ delegate(...events) {
        if (!events.length || !isStringArray(events)) {
            /**
			 * All event names must be strings.
			 *
			 * @error ui-viewcollection-delegate-wrong-events
			 */ throw new CKEditorError('ui-viewcollection-delegate-wrong-events', this);
        }
        return {
            to: (dest)=>{
                // Activate delegating on existing views in this collection.
                for (const view of this){
                    for (const evtName of events){
                        view.delegate(evtName).to(dest);
                    }
                }
                // Activate delegating on future views in this collection.
                this.on('add', (evt, view)=>{
                    for (const evtName of events){
                        view.delegate(evtName).to(dest);
                    }
                });
                // Deactivate delegating when view is removed from this collection.
                this.on('remove', (evt, view)=>{
                    for (const evtName of events){
                        view.stopDelegating(evtName, dest);
                    }
                });
            }
        };
    }
    /**
	 * This method {@link module:ui/view~View#render renders} a new view added to the collection.
	 *
	 * If the {@link #_parentElement parent element} of the collection is set, this method also adds
	 * the view's {@link module:ui/view~View#element} as a child of the parent in DOM at a specified index.
	 *
	 * **Note**: If index is not specified, the view's element is pushed as the last child
	 * of the parent element.
	 *
	 * @param view A new view added to the collection.
	 * @param index An index the view holds in the collection. When not specified,
	 * the view is added at the end.
	 */ _renderViewIntoCollectionParent(view, index) {
        if (!view.isRendered) {
            view.render();
        }
        if (view.element && this._parentElement) {
            this._parentElement.insertBefore(view.element, this._parentElement.children[index]);
        }
    }
    /**
	 * Removes a child view from the collection. If the {@link #setParent parent element} of the
	 * collection has been set, the {@link module:ui/view~View#element element} of the view is also removed
	 * in DOM, reflecting the order of the collection.
	 *
	 * See the {@link #add} method.
	 *
	 * @param subject The view to remove, its id or index in the collection.
	 * @returns The removed view.
	 */ remove(subject) {
        return super.remove(subject);
    }
}
/**
 * Check if all entries of the array are of `String` type.
 *
 * @param arr An array to be checked.
 */ function isStringArray(arr) {
    return arr.every((a)=>typeof a == 'string');
}

const xhtmlNs = 'http://www.w3.org/1999/xhtml';
/**
 * A basic Template class. It renders a DOM HTML element or text from a
 * {@link module:ui/template~TemplateDefinition definition} and supports element attributes, children,
 * bindings to {@link module:utils/observablemixin~Observable observables} and DOM event propagation.
 *
 * A simple template can look like this:
 *
 * ```ts
 * const bind = Template.bind( observable, emitter );
 *
 * new Template( {
 * 	tag: 'p',
 * 	attributes: {
 * 		class: 'foo',
 * 		style: {
 * 			backgroundColor: 'yellow'
 * 		}
 * 	},
 * 	on: {
 * 		click: bind.to( 'clicked' )
 * 	},
 * 	children: [
 * 		'A paragraph.'
 * 	]
 * } ).render();
 * ```
 *
 * and it will render the following HTML element:
 *
 * ```html
 * <p class="foo" style="background-color: yellow;">A paragraph.</p>
 * ```
 *
 * Additionally, the `observable` will always fire `clicked` upon clicking `<p>` in the DOM.
 *
 * See {@link module:ui/template~TemplateDefinition} to know more about templates and complex
 * template definitions.
 */ class Template extends /* #__PURE__ */ EmitterMixin() {
    ns;
    /**
	 * The tag (`tagName`) of this template, e.g. `div`. It also indicates that the template
	 * renders to an HTML element.
	 */ tag;
    /**
	 * The text of the template. It also indicates that the template renders to a DOM text node.
	 */ text;
    /**
	 * The attributes of the template, e.g. `{ id: [ 'ck-id' ] }`, corresponding with
	 * the attributes of an HTML element.
	 *
	 * **Note**: This property only makes sense when {@link #tag} is defined.
	 */ attributes;
    /**
	 * The children of the template. They can be either:
	 * * independent instances of {@link ~Template} (sub–templates),
	 * * native DOM Nodes.
	 *
	 * **Note**: This property only makes sense when {@link #tag} is defined.
	 */ children;
    /**
	 * The DOM event listeners of the template.
	 */ eventListeners;
    /**
	 * Indicates whether this particular Template instance has been
	 * {@link #render rendered}.
	 */ _isRendered;
    /**
	 * The data used by the {@link #revert} method to restore a node to its original state.
	 *
	 * See: {@link #apply}.
	 */ _revertData;
    /**
	 * Creates an instance of the {@link ~Template} class.
	 *
	 * @param def The definition of the template.
	 */ constructor(def){
        super();
        Object.assign(this, normalize(clone(def)));
        this._isRendered = false;
        this._revertData = null;
    }
    /**
	 * Renders a DOM Node (an HTML element or text) out of the template.
	 *
	 * ```ts
	 * const domNode = new Template( { ... } ).render();
	 * ```
	 *
	 * See: {@link #apply}.
	 */ render() {
        const node = this._renderNode({
            intoFragment: true
        });
        this._isRendered = true;
        return node;
    }
    /**
	 * Applies the template to an existing DOM Node, either HTML element or text.
	 *
	 * **Note:** No new DOM nodes will be created. Applying extends:
	 *
	 * {@link module:ui/template~TemplateDefinition attributes},
	 * {@link module:ui/template~TemplateDefinition event listeners}, and
	 * `textContent` of {@link module:ui/template~TemplateDefinition children} only.
	 *
	 * **Note:** Existing `class` and `style` attributes are extended when a template
	 * is applied to an HTML element, while other attributes and `textContent` are overridden.
	 *
	 * **Note:** The process of applying a template can be easily reverted using the
	 * {@link module:ui/template~Template#revert} method.
	 *
	 * ```ts
	 * const element = document.createElement( 'div' );
	 * const observable = new Model( { divClass: 'my-div' } );
	 * const emitter = Object.create( EmitterMixin );
	 * const bind = Template.bind( observable, emitter );
	 *
	 * new Template( {
	 * 	attributes: {
	 * 		id: 'first-div',
	 * 		class: bind.to( 'divClass' )
	 * 	},
	 * 	on: {
	 * 		click: bind( 'elementClicked' ) // Will be fired by the observable.
	 * 	},
	 * 	children: [
	 * 		'Div text.'
	 * 	]
	 * } ).apply( element );
	 *
	 * console.log( element.outerHTML ); // -> '<div id="first-div" class="my-div"></div>'
	 * ```
	 *
	 * @see module:ui/template~Template#render
	 * @see module:ui/template~Template#revert
	 * @param node Root node for the template to apply.
	 */ apply(node) {
        this._revertData = getEmptyRevertData();
        this._renderNode({
            node,
            intoFragment: false,
            isApplying: true,
            revertData: this._revertData
        });
        return node;
    }
    /**
	 * Reverts a template {@link module:ui/template~Template#apply applied} to a DOM node.
	 *
	 * @param node The root node for the template to revert. In most of the cases, it is the
	 * same node used by {@link module:ui/template~Template#apply}.
	 */ revert(node) {
        if (!this._revertData) {
            /**
			 * Attempting to revert a template which has not been applied yet.
			 *
			 * @error ui-template-revert-not-applied
			 */ throw new CKEditorError('ui-template-revert-not-applied', [
                this,
                node
            ]);
        }
        this._revertTemplateFromNode(node, this._revertData);
    }
    /**
	 * Returns an iterator which traverses the template in search of {@link module:ui/view~View}
	 * instances and returns them one by one.
	 *
	 * ```ts
	 * const viewFoo = new View();
	 * const viewBar = new View();
	 * const viewBaz = new View();
	 * const template = new Template( {
	 * 	tag: 'div',
	 * 	children: [
	 * 		viewFoo,
	 * 		{
	 * 			tag: 'div',
	 * 			children: [
	 * 				viewBar
	 * 			]
	 * 		},
	 * 		viewBaz
	 * 	]
	 * } );
	 *
	 * // Logs: viewFoo, viewBar, viewBaz
	 * for ( const view of template.getViews() ) {
	 * 	console.log( view );
	 * }
	 * ```
	 */ *getViews() {
        function* search(def) {
            if (def.children) {
                for (const child of def.children){
                    if (isView(child)) {
                        yield child;
                    } else if (isTemplate(child)) {
                        yield* search(child);
                    }
                }
            }
        }
        yield* search(this);
    }
    /**
	 * An entry point to the interface which binds DOM nodes to
	 * {@link module:utils/observablemixin~Observable observables}.
	 * There are two types of bindings:
	 *
	 * * HTML element attributes or text `textContent` synchronized with attributes of an
	 * {@link module:utils/observablemixin~Observable}. Learn more about {@link module:ui/template~BindChain#to}
	 * and {@link module:ui/template~BindChain#if}.
	 *
	 * ```ts
	 * const bind = Template.bind( observable, emitter );
	 *
	 * new Template( {
	 * 	attributes: {
	 * 		// Binds the element "class" attribute to observable#classAttribute.
	 * 		class: bind.to( 'classAttribute' )
	 * 	}
	 * } ).render();
	 * ```
	 *
	 * * DOM events fired on HTML element propagated through
	 * {@link module:utils/observablemixin~Observable}. Learn more about {@link module:ui/template~BindChain#to}.
	 *
	 * ```ts
	 * const bind = Template.bind( observable, emitter );
	 *
	 * new Template( {
	 * 	on: {
	 * 		// Will be fired by the observable.
	 * 		click: bind( 'elementClicked' )
	 * 	}
	 * } ).render();
	 * ```
	 *
	 * Also see {@link module:ui/view~View#bindTemplate}.
	 *
	 * @param observable An observable which provides boundable attributes.
	 * @param emitter An emitter that listens to observable attribute
	 * changes or DOM Events (depending on the kind of the binding). Usually, a {@link module:ui/view~View} instance.
	 */ static bind(observable, emitter) {
        return {
            to (eventNameOrFunctionOrAttribute, callback) {
                return new TemplateToBinding({
                    eventNameOrFunction: eventNameOrFunctionOrAttribute,
                    attribute: eventNameOrFunctionOrAttribute,
                    observable,
                    emitter,
                    callback
                });
            },
            if (attribute, valueIfTrue, callback) {
                return new TemplateIfBinding({
                    observable,
                    emitter,
                    attribute,
                    valueIfTrue,
                    callback
                });
            }
        };
    }
    /**
	 * Extends an existing {@link module:ui/template~Template} instance with some additional content
	 * from another {@link module:ui/template~TemplateDefinition}.
	 *
	 * ```ts
	 * const bind = Template.bind( observable, emitter );
	 *
	 * const template = new Template( {
	 * 	tag: 'p',
	 * 	attributes: {
	 * 		class: 'a',
	 * 		data-x: bind.to( 'foo' )
	 * 	},
	 * 	children: [
	 * 		{
	 * 			tag: 'span',
	 * 			attributes: {
	 * 				class: 'b'
	 * 			},
	 * 			children: [
	 * 				'Span'
	 * 			]
	 * 		}
	 * 	]
	 *  } );
	 *
	 * // Instance-level extension.
	 * Template.extend( template, {
	 * 	attributes: {
	 * 		class: 'b',
	 * 		data-x: bind.to( 'bar' )
	 * 	},
	 * 	children: [
	 * 		{
	 * 			attributes: {
	 * 				class: 'c'
	 * 			}
	 * 		}
	 * 	]
	 * } );
	 *
	 * // Child extension.
	 * Template.extend( template.children[ 0 ], {
	 * 	attributes: {
	 * 		class: 'd'
	 * 	}
	 * } );
	 * ```
	 *
	 * the `outerHTML` of `template.render()` is:
	 *
	 * ```html
	 * <p class="a b" data-x="{ observable.foo } { observable.bar }">
	 * 	<span class="b c d">Span</span>
	 * </p>
	 * ```
	 *
	 * @param template An existing template instance to be extended.
	 * @param def Additional definition to be applied to a template.
	 */ static extend(template, def) {
        if (template._isRendered) {
            /**
			 * Extending a template after rendering may not work as expected. To make sure
			 * the {@link module:ui/template~Template.extend extending} works for an element,
			 * make sure it happens before {@link module:ui/template~Template#render} is called.
			 *
			 * @error template-extend-render
			 */ throw new CKEditorError('template-extend-render', [
                this,
                template
            ]);
        }
        extendTemplate(template, normalize(clone(def)));
    }
    /**
	 * Renders a DOM Node (either an HTML element or text) out of the template.
	 *
	 * @param data Rendering data.
	 */ _renderNode(data) {
        let isInvalid;
        if (data.node) {
            // When applying, a definition cannot have "tag" and "text" at the same time.
            isInvalid = this.tag && this.text;
        } else {
            // When rendering, a definition must have either "tag" or "text": XOR( this.tag, this.text ).
            isInvalid = this.tag ? this.text : !this.text;
        }
        if (isInvalid) {
            /**
			 * Node definition cannot have the "tag" and "text" properties at the same time.
			 * Node definition must have either "tag" or "text" when rendering a new Node.
			 *
			 * @error ui-template-wrong-syntax
			 */ throw new CKEditorError('ui-template-wrong-syntax', this);
        }
        if (this.text) {
            return this._renderText(data);
        } else {
            return this._renderElement(data);
        }
    }
    /**
	 * Renders an HTML element out of the template.
	 *
	 * @param data Rendering data.
	 */ _renderElement(data) {
        let node = data.node;
        if (!node) {
            node = data.node = document.createElementNS(this.ns || xhtmlNs, this.tag);
        }
        this._renderAttributes(data);
        this._renderElementChildren(data);
        this._setUpListeners(data);
        return node;
    }
    /**
	 * Renders a text node out of {@link module:ui/template~Template#text}.
	 *
	 * @param data Rendering data.
	 */ _renderText(data) {
        let node = data.node;
        // Save the original textContent to revert it in #revert().
        if (node) {
            data.revertData.text = node.textContent;
        } else {
            node = data.node = document.createTextNode('');
        }
        // Check if this Text Node is bound to Observable. Cases:
        //
        //		text: [ Template.bind( ... ).to( ... ) ]
        //
        //		text: [
        //			'foo',
        //			Template.bind( ... ).to( ... ),
        //			...
        //		]
        //
        if (hasTemplateBinding(this.text)) {
            this._bindToObservable({
                schema: this.text,
                updater: getTextUpdater(node),
                data
            });
        } else {
            node.textContent = this.text.join('');
        }
        return node;
    }
    /**
	 * Renders HTML element attributes out of {@link module:ui/template~Template#attributes}.
	 *
	 * @param data Rendering data.
	 */ _renderAttributes(data) {
        if (!this.attributes) {
            return;
        }
        const node = data.node;
        const revertData = data.revertData;
        for(const attrName in this.attributes){
            // Current attribute value in DOM.
            const domAttrValue = node.getAttribute(attrName);
            // The value to be set.
            const attrValue = this.attributes[attrName];
            // Save revert data.
            if (revertData) {
                revertData.attributes[attrName] = domAttrValue;
            }
            // Detect custom namespace:
            //
            //		class: {
            //			ns: 'abc',
            //			value: Template.bind( ... ).to( ... )
            //		}
            //
            const attrNs = isNamespaced(attrValue) ? attrValue[0].ns : null;
            // Activate binding if one is found. Cases:
            //
            //		class: [
            //			Template.bind( ... ).to( ... )
            //		]
            //
            //		class: [
            //			'bar',
            //			Template.bind( ... ).to( ... ),
            //			'baz'
            //		]
            //
            //		class: {
            //			ns: 'abc',
            //			value: Template.bind( ... ).to( ... )
            //		}
            //
            if (hasTemplateBinding(attrValue)) {
                // Normalize attributes with additional data like namespace:
                //
                //		class: {
                //			ns: 'abc',
                //			value: [ ... ]
                //		}
                //
                const valueToBind = isNamespaced(attrValue) ? attrValue[0].value : attrValue;
                // Extend the original value of attributes like "style" and "class",
                // don't override them.
                if (revertData && shouldExtend(attrName)) {
                    valueToBind.unshift(domAttrValue);
                }
                this._bindToObservable({
                    schema: valueToBind,
                    updater: getAttributeUpdater(node, attrName, attrNs),
                    data
                });
            } else if (attrName == 'style' && typeof attrValue[0] !== 'string') {
                this._renderStyleAttribute(attrValue[0], data);
            } else {
                // Extend the original value of attributes like "style" and "class",
                // don't override them.
                if (revertData && domAttrValue && shouldExtend(attrName)) {
                    attrValue.unshift(domAttrValue);
                }
                const value = attrValue// Retrieve "values" from:
                //
                //		class: [
                //			{
                //				ns: 'abc',
                //				value: [ ... ]
                //			}
                //		]
                //
                .map((val)=>val ? val.value || val : val)// Flatten the array.
                .reduce((prev, next)=>prev.concat(next), [])// Convert into string.
                .reduce(arrayValueReducer, '');
                if (!isFalsy(value)) {
                    node.setAttributeNS(attrNs, attrName, value);
                }
            }
        }
    }
    /**
	 * Renders the `style` attribute of an HTML element based on
	 * {@link module:ui/template~Template#attributes}.
	 *
	 * A style attribute is an object with static values:
	 *
	 * ```ts
	 * attributes: {
	 * 	style: {
	 * 		color: 'red'
	 * 	}
	 * }
	 * ```
	 *
	 * or values bound to {@link module:ui/model~Model} properties:
	 *
	 * ```ts
	 * attributes: {
	 * 	style: {
	 * 		color: bind.to( ... )
	 * 	}
	 * }
	 * ```
	 *
	 * Note: The `style` attribute is rendered without setting the namespace. It does not seem to be
	 * needed.
	 *
	 * @param styles Styles located in `attributes.style` of {@link module:ui/template~TemplateDefinition}.
	 * @param data Rendering data.
	 */ _renderStyleAttribute(styles, data) {
        const node = data.node;
        for(const styleName in styles){
            const styleValue = styles[styleName];
            // Cases:
            //
            //		style: {
            //			color: bind.to( 'attribute' )
            //		}
            //
            if (hasTemplateBinding(styleValue)) {
                this._bindToObservable({
                    schema: [
                        styleValue
                    ],
                    updater: getStyleUpdater(node, styleName),
                    data
                });
            } else {
                node.style[styleName] = styleValue;
            }
        }
    }
    /**
	 * Recursively renders HTML element's children from {@link module:ui/template~Template#children}.
	 *
	 * @param data Rendering data.
	 */ _renderElementChildren(data) {
        const node = data.node;
        const container = data.intoFragment ? document.createDocumentFragment() : node;
        const isApplying = data.isApplying;
        let childIndex = 0;
        for (const child of this.children){
            if (isViewCollection(child)) {
                if (!isApplying) {
                    child.setParent(node);
                    // Note: ViewCollection renders its children.
                    for (const view of child){
                        container.appendChild(view.element);
                    }
                }
            } else if (isView(child)) {
                if (!isApplying) {
                    if (!child.isRendered) {
                        child.render();
                    }
                    container.appendChild(child.element);
                }
            } else if (isNode(child)) {
                container.appendChild(child);
            } else {
                if (isApplying) {
                    const revertData = data.revertData;
                    const childRevertData = getEmptyRevertData();
                    revertData.children.push(childRevertData);
                    child._renderNode({
                        intoFragment: false,
                        node: container.childNodes[childIndex++],
                        isApplying: true,
                        revertData: childRevertData
                    });
                } else {
                    container.appendChild(child.render());
                }
            }
        }
        if (data.intoFragment) {
            node.appendChild(container);
        }
    }
    /**
	 * Activates `on` event listeners from the {@link module:ui/template~TemplateDefinition}
	 * on an HTML element.
	 *
	 * @param data Rendering data.
	 */ _setUpListeners(data) {
        if (!this.eventListeners) {
            return;
        }
        for(const key in this.eventListeners){
            const revertBindings = this.eventListeners[key].map((schemaItem)=>{
                const [domEvtName, domSelector] = key.split('@');
                return schemaItem.activateDomEventListener(domEvtName, domSelector, data);
            });
            if (data.revertData) {
                data.revertData.bindings.push(revertBindings);
            }
        }
    }
    /**
	 * For a given {@link module:ui/template~TemplateValueSchema} containing {@link module:ui/template~TemplateBinding}
	 * activates the binding and sets its initial value.
	 *
	 * Note: {@link module:ui/template~TemplateValueSchema} can be for HTML element attributes or
	 * text node `textContent`.
	 *
	 * @param options Binding options.
	 * @param options.updater A function which updates the DOM (like attribute or text).
	 * @param options.data Rendering data.
	 */ _bindToObservable({ schema, updater, data }) {
        const revertData = data.revertData;
        // Set initial values.
        syncValueSchemaValue(schema, updater, data);
        const revertBindings = schema// Filter "falsy" (false, undefined, null, '') value schema components out.
        .filter((item)=>!isFalsy(item))// Filter inactive bindings from schema, like static strings ('foo'), numbers (42), etc.
        .filter((item)=>item.observable)// Once only the actual binding are left, let the emitter listen to observable change:attribute event.
        // TODO: Reduce the number of listeners attached as many bindings may listen
        // to the same observable attribute.
        .map((templateBinding)=>templateBinding.activateAttributeListener(schema, updater, data));
        if (revertData) {
            revertData.bindings.push(revertBindings);
        }
    }
    /**
	 * Reverts {@link module:ui/template~RenderData#revertData template data} from a node to
	 * return it to the original state.
	 *
	 * @param node A node to be reverted.
	 * @param revertData An object that stores information about what changes have been made by
	 * {@link #apply} to the node. See {@link module:ui/template~RenderData#revertData} for more information.
	 */ _revertTemplateFromNode(node, revertData) {
        for (const binding of revertData.bindings){
            // Each binding may consist of several observable+observable#attribute.
            // like the following has 2:
            //
            //		class: [
            //			'x',
            //			bind.to( 'foo' ),
            //			'y',
            //			bind.to( 'bar' )
            //		]
            //
            for (const revertBinding of binding){
                revertBinding();
            }
        }
        if (revertData.text) {
            node.textContent = revertData.text;
            return;
        }
        const element = node;
        for(const attrName in revertData.attributes){
            const attrValue = revertData.attributes[attrName];
            // When the attribute has **not** been set before #apply().
            if (attrValue === null) {
                element.removeAttribute(attrName);
            } else {
                element.setAttribute(attrName, attrValue);
            }
        }
        for(let i = 0; i < revertData.children.length; ++i){
            this._revertTemplateFromNode(element.childNodes[i], revertData.children[i]);
        }
    }
}
/**
 * Describes a binding created by the {@link module:ui/template~Template.bind} interface.
 *
 * @internal
 */ class TemplateBinding {
    /**
	 * The name of the {@link module:ui/template~TemplateBinding#observable observed attribute}.
	 */ attribute;
    /**
	 * An observable instance of the binding. It either:
	 *
	 * * provides the attribute with the value,
	 * * or passes the event when a corresponding DOM event is fired.
	 */ observable;
    /**
	 * An {@link module:utils/emittermixin~Emitter} used by the binding to:
	 *
	 * * listen to the attribute change in the {@link module:ui/template~TemplateBinding#observable},
	 * * or listen to the event in the DOM.
	 */ emitter;
    /**
	 * A custom function to process the value of the {@link module:ui/template~TemplateBinding#attribute}.
	 */ callback;
    /**
	 * Creates an instance of the {@link module:ui/template~TemplateBinding} class.
	 *
	 * @param def The definition of the binding.
	 */ constructor(def){
        this.attribute = def.attribute;
        this.observable = def.observable;
        this.emitter = def.emitter;
        this.callback = def.callback;
    }
    /**
	 * Returns the value of the binding. It is the value of the {@link module:ui/template~TemplateBinding#attribute} in
	 * {@link module:ui/template~TemplateBinding#observable}. The value may be processed by the
	 * {@link module:ui/template~TemplateBinding#callback}, if such has been passed to the binding.
	 *
	 * @param node A native DOM node, passed to the custom {@link module:ui/template~TemplateBinding#callback}.
	 * @returns The value of {@link module:ui/template~TemplateBinding#attribute} in
	 * {@link module:ui/template~TemplateBinding#observable}.
	 */ getValue(node) {
        const value = this.observable[this.attribute];
        return this.callback ? this.callback(value, node) : value;
    }
    /**
	 * Activates the listener which waits for changes of the {@link module:ui/template~TemplateBinding#attribute} in
	 * {@link module:ui/template~TemplateBinding#observable}, then updates the DOM with the aggregated
	 * value of {@link module:ui/template~TemplateValueSchema}.
	 *
	 * @param schema A full schema to generate an attribute or text in the DOM.
	 * @param updater A DOM updater function used to update the native DOM attribute or text.
	 * @param data Rendering data.
	 * @returns A function to sever the listener binding.
	 */ activateAttributeListener(schema, updater, data) {
        const callback = ()=>syncValueSchemaValue(schema, updater, data);
        this.emitter.listenTo(this.observable, `change:${this.attribute}`, callback);
        // Allows revert of the listener.
        return ()=>{
            this.emitter.stopListening(this.observable, `change:${this.attribute}`, callback);
        };
    }
}
/**
 * Describes either:
 *
 * * a binding to an {@link module:utils/observablemixin~Observable},
 * * or a native DOM event binding.
 *
 * It is created by the {@link module:ui/template~BindChain#to} method.
 *
 * @internal
 */ class TemplateToBinding extends TemplateBinding {
    eventNameOrFunction;
    constructor(def){
        super(def);
        this.eventNameOrFunction = def.eventNameOrFunction;
    }
    /**
	 * Activates the listener for the native DOM event, which when fired, is propagated by
	 * the {@link module:ui/template~TemplateBinding#emitter}.
	 *
	 * @param domEvtName The name of the native DOM event.
	 * @param domSelector The selector in the DOM to filter delegated events.
	 * @param data Rendering data.
	 * @returns A function to sever the listener binding.
	 */ activateDomEventListener(domEvtName, domSelector, data) {
        const callback = (evt, domEvt)=>{
            if (!domSelector || domEvt.target.matches(domSelector)) {
                if (typeof this.eventNameOrFunction == 'function') {
                    this.eventNameOrFunction(domEvt);
                } else {
                    this.observable.fire(this.eventNameOrFunction, domEvt);
                }
            }
        };
        this.emitter.listenTo(data.node, domEvtName, callback);
        // Allows revert of the listener.
        return ()=>{
            this.emitter.stopListening(data.node, domEvtName, callback);
        };
    }
}
/**
 * Describes a binding to {@link module:utils/observablemixin~Observable} created by the {@link module:ui/template~BindChain#if}
 * method.
 *
 * @internal
 */ class TemplateIfBinding extends TemplateBinding {
    /**
	 * The value of the DOM attribute or text to be set if the {@link module:ui/template~TemplateBinding#attribute} in
	 * {@link module:ui/template~TemplateBinding#observable} is `true`.
	 */ valueIfTrue;
    constructor(def){
        super(def);
        this.valueIfTrue = def.valueIfTrue;
    }
    /**
	 * @inheritDoc
	 */ getValue(node) {
        const value = super.getValue(node);
        return isFalsy(value) ? false : this.valueIfTrue || true;
    }
}
/**
 * Checks whether given {@link module:ui/template~TemplateValueSchema} contains a
 * {@link module:ui/template~TemplateBinding}.
 */ function hasTemplateBinding(schema) {
    if (!schema) {
        return false;
    }
    // Normalize attributes with additional data like namespace:
    //
    //		class: {
    //			ns: 'abc',
    //			value: [ ... ]
    //		}
    //
    if (schema.value) {
        schema = schema.value;
    }
    if (Array.isArray(schema)) {
        return schema.some(hasTemplateBinding);
    } else if (schema instanceof TemplateBinding) {
        return true;
    }
    return false;
}
/**
 * Assembles the value using {@link module:ui/template~TemplateValueSchema} and stores it in a form of
 * an Array. Each entry of the Array corresponds to one of {@link module:ui/template~TemplateValueSchema}
 * items.
 *
 * @param node DOM Node updated when {@link module:utils/observablemixin~Observable} changes.
 */ function getValueSchemaValue(schema, node) {
    return schema.map((schemaItem)=>{
        // Process {@link module:ui/template~TemplateBinding} bindings.
        if (schemaItem instanceof TemplateBinding) {
            return schemaItem.getValue(node);
        }
        // All static values like strings, numbers, and "falsy" values (false, null, undefined, '', etc.) just pass.
        return schemaItem;
    });
}
/**
 * A function executed each time the bound Observable attribute changes, which updates the DOM with a value
 * constructed from {@link module:ui/template~TemplateValueSchema}.
 *
 * @param updater A function which updates the DOM (like attribute or text).
 * @param node DOM Node updated when {@link module:utils/observablemixin~Observable} changes.
 */ function syncValueSchemaValue(schema, updater, { node }) {
    const values = getValueSchemaValue(schema, node);
    let value;
    // Check if schema is a single Template.bind.if, like:
    //
    //		class: Template.bind.if( 'foo' )
    //
    if (schema.length == 1 && schema[0] instanceof TemplateIfBinding) {
        value = values[0];
    } else {
        value = values.reduce(arrayValueReducer, '');
    }
    if (isFalsy(value)) {
        updater.remove();
    } else {
        updater.set(value);
    }
}
/**
 * Returns an object consisting of `set` and `remove` functions, which
 * can be used in the context of DOM Node to set or reset `textContent`.
 * @see module:ui/view~View#_bindToObservable
 *
 * @param node DOM Node to be modified.
 */ function getTextUpdater(node) {
    return {
        set (value) {
            node.textContent = value;
        },
        remove () {
            node.textContent = '';
        }
    };
}
/**
 * Returns an object consisting of `set` and `remove` functions, which
 * can be used in the context of DOM Node to set or reset an attribute.
 * @see module:ui/view~View#_bindToObservable
 *
 * @param el DOM Node to be modified.
 * @param attrName Name of the attribute to be modified.
 * @param ns Namespace to use.
 */ function getAttributeUpdater(el, attrName, ns) {
    return {
        set (value) {
            el.setAttributeNS(ns, attrName, value);
        },
        remove () {
            el.removeAttributeNS(ns, attrName);
        }
    };
}
/**
 * Returns an object consisting of `set` and `remove` functions, which
 * can be used in the context of CSSStyleDeclaration to set or remove a style.
 * @see module:ui/view~View#_bindToObservable
 *
 * @param el DOM Node to be modified.
 * @param styleName Name of the style to be modified.
 */ function getStyleUpdater(el, styleName) {
    return {
        set (value) {
            el.style[styleName] = value;
        },
        remove () {
            el.style[styleName] = null;
        }
    };
}
/**
 * Clones definition of the template.
 */ function clone(def) {
    const clone = cloneDeepWith(def, (value)=>{
        // Don't clone the `Template.bind`* bindings because of the references to Observable
        // and DomEmitterMixin instances inside, which would also be traversed and cloned by greedy
        // cloneDeepWith algorithm. There's no point in cloning Observable/DomEmitterMixins
        // along with the definition.
        //
        // Don't clone Template instances if provided as a child. They're simply #render()ed
        // and nothing should interfere.
        //
        // Also don't clone View instances if provided as a child of the Template. The template
        // instance will be extracted from the View during the normalization and there's no need
        // to clone it.
        if (value && (value instanceof TemplateBinding || isTemplate(value) || isView(value) || isViewCollection(value))) {
            return value;
        }
    });
    return clone;
}
/**
 * Normalizes given {@link module:ui/template~TemplateDefinition}.
 *
 * See:
 *  * {@link normalizeAttributes}
 *  * {@link normalizeListeners}
 *  * {@link normalizePlainTextDefinition}
 *  * {@link normalizeTextDefinition}
 *
 * @param def A template definition.
 * @returns Normalized definition.
 */ function normalize(def) {
    if (typeof def == 'string') {
        def = normalizePlainTextDefinition(def);
    } else if (def.text) {
        normalizeTextDefinition(def);
    }
    if (def.on) {
        def.eventListeners = normalizeListeners(def.on);
        // Template mixes EmitterMixin, so delete #on to avoid collision.
        delete def.on;
    }
    if (!def.text) {
        if (def.attributes) {
            normalizeAttributes(def.attributes);
        }
        const children = [];
        if (def.children) {
            if (isViewCollection(def.children)) {
                children.push(def.children);
            } else {
                for (const child of def.children){
                    if (isTemplate(child) || isView(child) || isNode(child)) {
                        children.push(child);
                    } else {
                        children.push(new Template(child));
                    }
                }
            }
        }
        def.children = children;
    }
    return def;
}
/**
 * Normalizes "attributes" section of {@link module:ui/template~TemplateDefinition}.
 *
 * ```
 * attributes: {
 * 	a: 'bar',
 * 	b: {@link module:ui/template~TemplateBinding},
 * 	c: {
 * 		value: 'bar'
 * 	}
 * }
 * ```
 *
 * becomes
 *
 * ```
 * attributes: {
 * 	a: [ 'bar' ],
 * 	b: [ {@link module:ui/template~TemplateBinding} ],
 * 	c: {
 * 		value: [ 'bar' ]
 * 	}
 * }
 * ```
 */ function normalizeAttributes(attributes) {
    for(const a in attributes){
        if (attributes[a].value) {
            attributes[a].value = toArray(attributes[a].value);
        }
        arrayify(attributes, a);
    }
}
/**
 * Normalizes "on" section of {@link module:ui/template~TemplateDefinition}.
 *
 * ```
 * on: {
 * 	a: 'bar',
 * 	b: {@link module:ui/template~TemplateBinding},
 * 	c: [ {@link module:ui/template~TemplateBinding}, () => { ... } ]
 * }
 * ```
 *
 * becomes
 *
 * ```
 * on: {
 * 	a: [ 'bar' ],
 * 	b: [ {@link module:ui/template~TemplateBinding} ],
 * 	c: [ {@link module:ui/template~TemplateBinding}, () => { ... } ]
 * }
 * ```
 *
 * @returns Object containing normalized listeners.
 */ function normalizeListeners(listeners) {
    for(const l in listeners){
        arrayify(listeners, l);
    }
    return listeners;
}
/**
 * Normalizes "string" {@link module:ui/template~TemplateDefinition}.
 *
 * ```
 * "foo"
 * ```
 *
 * becomes
 *
 * ```
 * { text: [ 'foo' ] },
 * ```
 *
 * @returns Normalized template definition.
 */ function normalizePlainTextDefinition(def) {
    return {
        text: [
            def
        ]
    };
}
/**
 * Normalizes text {@link module:ui/template~TemplateDefinition}.
 *
 * ```
 * children: [
 * 	{ text: 'def' },
 * 	{ text: {@link module:ui/template~TemplateBinding} }
 * ]
 * ```
 *
 * becomes
 *
 * ```
 * children: [
 * 	{ text: [ 'def' ] },
 * 	{ text: [ {@link module:ui/template~TemplateBinding} ] }
 * ]
 * ```
 */ function normalizeTextDefinition(def) {
    def.text = toArray(def.text);
}
/**
 * Wraps an entry in Object in an Array, if not already one.
 *
 * ```
 * {
 * 	x: 'y',
 * 	a: [ 'b' ]
 * }
 * ```
 *
 * becomes
 *
 * ```
 * {
 * 	x: [ 'y' ],
 * 	a: [ 'b' ]
 * }
 * ```
 */ function arrayify(obj, key) {
    obj[key] = toArray(obj[key]);
}
/**
 * A helper which concatenates the value avoiding unwanted
 * leading white spaces.
 */ function arrayValueReducer(prev, cur) {
    if (isFalsy(cur)) {
        return prev;
    } else if (isFalsy(prev)) {
        return cur;
    } else {
        return `${prev} ${cur}`;
    }
}
/**
 * Extends one object defined in the following format:
 *
 * ```
 * {
 * 	key1: [Array1],
 * 	key2: [Array2],
 * 	...
 * 	keyN: [ArrayN]
 * }
 * ```
 *
 * with another object of the same data format.
 *
 * @param obj Base object.
 * @param ext Object extending base.
 */ function extendObjectValueArray(obj, ext) {
    for(const a in ext){
        if (obj[a]) {
            obj[a].push(...ext[a]);
        } else {
            obj[a] = ext[a];
        }
    }
}
/**
 * A helper for {@link module:ui/template~Template#extend}. Recursively extends {@link module:ui/template~Template} instance
 * with content from {@link module:ui/template~TemplateDefinition}. See {@link module:ui/template~Template#extend} to learn more.
 *
 * @param def A template instance to be extended.
 * @param def A definition which is to extend the template instance.
 * @param Error context.
 */ function extendTemplate(template, def) {
    if (def.attributes) {
        if (!template.attributes) {
            template.attributes = {};
        }
        extendObjectValueArray(template.attributes, def.attributes);
    }
    if (def.eventListeners) {
        if (!template.eventListeners) {
            template.eventListeners = {};
        }
        extendObjectValueArray(template.eventListeners, def.eventListeners);
    }
    if (def.text) {
        template.text.push(...def.text);
    }
    if (def.children && def.children.length) {
        if (template.children.length != def.children.length) {
            /**
			 * The number of children in extended definition does not match.
			 *
			 * @error ui-template-extend-children-mismatch
			 */ throw new CKEditorError('ui-template-extend-children-mismatch', template);
        }
        let childIndex = 0;
        for (const childDef of def.children){
            extendTemplate(template.children[childIndex++], childDef);
        }
    }
}
/**
 * Checks if value is "falsy".
 * Note: 0 (Number) is not "falsy" in this context.
 *
 * @param value Value to be checked.
 */ function isFalsy(value) {
    return !value && value !== 0;
}
/**
 * Checks if the item is an instance of {@link module:ui/view~View}
 *
 * @param value Value to be checked.
 */ function isView(item) {
    return item instanceof View;
}
/**
 * Checks if the item is an instance of {@link module:ui/template~Template}
 *
 * @param value Value to be checked.
 */ function isTemplate(item) {
    return item instanceof Template;
}
/**
 * Checks if the item is an instance of {@link module:ui/viewcollection~ViewCollection}
 *
 * @param value Value to be checked.
 */ function isViewCollection(item) {
    return item instanceof ViewCollection;
}
/**
 * Checks if value array contains the one with namespace.
 */ function isNamespaced(attrValue) {
    return isObject(attrValue[0]) && attrValue[0].ns;
}
/**
 * Creates an empty skeleton for {@link module:ui/template~Template#revert}
 * data.
 */ function getEmptyRevertData() {
    return {
        children: [],
        bindings: [],
        attributes: {}
    };
}
/**
 * Checks whether an attribute should be extended when
 * {@link module:ui/template~Template#apply} is called.
 *
 * @param attrName Attribute name to check.
 */ function shouldExtend(attrName) {
    return attrName == 'class' || attrName == 'style';
}

/**
 * The basic view class, which represents an HTML element created out of a
 * {@link module:ui/view~View#template}. Views are building blocks of the user interface and handle
 * interaction
 *
 * Views {@link module:ui/view~View#registerChild aggregate} children in
 * {@link module:ui/view~View#createCollection collections} and manage the life cycle of DOM
 * listeners e.g. by handling rendering and destruction.
 *
 * See the {@link module:ui/template~TemplateDefinition} syntax to learn more about shaping view
 * elements, attributes and listeners.
 *
 * ```ts
 * class SampleView extends View {
 * 	constructor( locale ) {
 * 		super( locale );
 *
 * 		const bind = this.bindTemplate;
 *
 * 		// Views define their interface (state) using observable attributes.
 * 		this.set( 'elementClass', 'bar' );
 *
 * 		this.setTemplate( {
 * 			tag: 'p',
 *
 * 			// The element of the view can be defined with its children.
 * 			children: [
 * 				'Hello',
 * 				{
 * 					tag: 'b',
 * 					children: [ 'world!' ]
 * 				}
 * 			],
 * 			attributes: {
 * 				class: [
 * 					'foo',
 *
 * 					// Observable attributes control the state of the view in DOM.
 * 					bind.to( 'elementClass' )
 * 				]
 * 			},
 * 			on: {
 * 				// Views listen to DOM events and propagate them.
 * 				click: bind.to( 'clicked' )
 * 			}
 * 		} );
 * 	}
 * }
 *
 * const view = new SampleView( locale );
 *
 * view.render();
 *
 * // Append <p class="foo bar">Hello<b>world</b></p> to the <body>
 * document.body.appendChild( view.element );
 *
 * // Change the class attribute to <p class="foo baz">Hello<b>world</b></p>
 * view.elementClass = 'baz';
 *
 * // Respond to the "click" event in DOM by executing a custom action.
 * view.on( 'clicked', () => {
 * 	console.log( 'The view has been clicked!' );
 * } );
 * ```
 */ class View extends /* #__PURE__ */ DomEmitterMixin(/* #__PURE__ */ ObservableMixin()) {
    /**
	 * An HTML element of the view. `null` until {@link #render rendered}
	 * from the {@link #template}.
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor() {
	 * 		super();
	 *
	 * 		// A template instance the #element will be created from.
	 * 		this.setTemplate( {
	 * 			tag: 'p'
	 *
	 * 			// ...
	 * 		} );
	 * 	}
	 * }
	 *
	 * const view = new SampleView();
	 *
	 * // Renders the #template.
	 * view.render();
	 *
	 * // Append the HTML element of the view to <body>.
	 * document.body.appendChild( view.element );
	 * ```
	 *
	 * **Note**: The element of the view can also be assigned directly:
	 *
	 * ```ts
	 * view.element = document.querySelector( '#my-container' );
	 * ```
	 */ element;
    /**
	 * Set `true` when the view has already been {@link module:ui/view~View#render rendered}.
	 *
	 * @readonly
	 */ isRendered;
    /**
	 * A set of tools to localize the user interface.
	 *
	 * Also see {@link module:core/editor/editor~Editor#locale}.
	 *
	 * @readonly
	 */ locale;
    /**
	 * Shorthand for {@link module:utils/locale~Locale#t}.
	 *
	 * Note: If {@link #locale} instance hasn't been passed to the view this method may not
	 * be available.
	 *
	 * @see module:utils/locale~Locale#t
	 */ t;
    /**
	 * Template of this view. It provides the {@link #element} representing
	 * the view in DOM, which is {@link #render rendered}.
	 */ template;
    /**
	 * Collections registered with {@link #createCollection}.
	 */ _viewCollections;
    /**
	 * A collection of view instances, which have been added directly
	 * into the {@link module:ui/template~Template#children}.
	 */ _unboundChildren;
    /**
	 * Cached {@link module:ui/template~BindChain bind chain} object created by the
	 * {@link #template}. See {@link #bindTemplate}.
	 */ _bindTemplate;
    /**
	 * Creates an instance of the {@link module:ui/view~View} class.
	 *
	 * Also see {@link #render}.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super();
        this.element = null;
        this.isRendered = false;
        this.locale = locale;
        this.t = locale && locale.t;
        this._viewCollections = new Collection();
        this._unboundChildren = this.createCollection();
        // Pass parent locale to its children.
        this._viewCollections.on('add', (evt, collection)=>{
            collection.locale = locale;
            collection.t = locale && locale.t;
        });
        this.decorate('render');
    }
    /**
	 * Shorthand for {@link module:ui/template~Template.bind}, a binding
	 * {@link module:ui/template~BindChain interface} pre–configured for the view instance.
	 *
	 * It provides {@link module:ui/template~BindChain#to `to()`} and
	 * {@link module:ui/template~BindChain#if `if()`} methods that initialize bindings with
	 * observable attributes and attach DOM listeners.
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor( locale ) {
	 * 		super( locale );
	 *
	 * 		const bind = this.bindTemplate;
	 *
	 * 		// These {@link module:utils/observablemixin~Observable observable} attributes will control
	 * 		// the state of the view in DOM.
	 * 		this.set( {
	 * 			elementClass: 'foo',
	 * 		 	isEnabled: true
	 * 		 } );
	 *
	 * 		this.setTemplate( {
	 * 			tag: 'p',
	 *
	 * 			attributes: {
	 * 				// The class HTML attribute will follow elementClass
	 * 				// and isEnabled view attributes.
	 * 				class: [
	 * 					bind.to( 'elementClass' )
	 * 					bind.if( 'isEnabled', 'present-when-enabled' )
	 * 				]
	 * 			},
	 *
	 * 			on: {
	 * 				// The view will fire the "clicked" event upon clicking <p> in DOM.
	 * 				click: bind.to( 'clicked' )
	 * 			}
	 * 		} );
	 * 	}
	 * }
	 * ```
	 */ get bindTemplate() {
        if (this._bindTemplate) {
            return this._bindTemplate;
        }
        return this._bindTemplate = Template.bind(this, this);
    }
    /**
	 * Creates a new collection of views, which can be used as
	 * {@link module:ui/template~Template#children} of this view.
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor( locale ) {
	 * 		super( locale );
	 *
	 * 		const child = new ChildView( locale );
	 * 		this.items = this.createCollection( [ child ] );
 	 *
	 * 		this.setTemplate( {
	 * 			tag: 'p',
	 *
	 * 			// `items` collection will render here.
	 * 			children: this.items
	 * 		} );
	 * 	}
	 * }
	 *
	 * const view = new SampleView( locale );
	 * view.render();
	 *
	 * // It will append <p><child#element></p> to the <body>.
	 * document.body.appendChild( view.element );
	 * ```
	 *
	 * @param views Initial views of the collection.
	 * @returns A new collection of view instances.
	 */ createCollection(views) {
        const collection = new ViewCollection(views);
        this._viewCollections.add(collection);
        return collection;
    }
    /**
	 * Registers a new child view under the view instance. Once registered, a child
	 * view is managed by its parent, including {@link #render rendering}
	 * and {@link #destroy destruction}.
	 *
	 * To revert this, use {@link #deregisterChild}.
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor( locale ) {
	 * 		super( locale );
	 *
	 * 		this.childA = new SomeChildView( locale );
	 * 		this.childB = new SomeChildView( locale );
	 *
	 * 		this.setTemplate( { tag: 'p' } );
	 *
	 * 		// Register the children.
	 * 		this.registerChild( [ this.childA, this.childB ] );
	 * 	}
	 *
	 * 	render() {
	 * 		super.render();
	 *
	 * 		this.element.appendChild( this.childA.element );
	 * 		this.element.appendChild( this.childB.element );
	 * 	}
	 * }
	 *
	 * const view = new SampleView( locale );
	 *
	 * view.render();
	 *
	 * // Will append <p><childA#element><b></b><childB#element></p>.
	 * document.body.appendChild( view.element );
	 * ```
	 *
	 * **Note**: There's no need to add child views if they're already referenced in the
	 * {@link #template}:
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor( locale ) {
	 * 		super( locale );
	 *
	 * 		this.childA = new SomeChildView( locale );
	 * 		this.childB = new SomeChildView( locale );
	 *
	 * 		this.setTemplate( {
	 * 			tag: 'p',
	 *
 	 * 			// These children will be added automatically. There's no
 	 * 			// need to call {@link #registerChild} for any of them.
	 * 			children: [ this.childA, this.childB ]
	 * 		} );
	 * 	}
	 *
	 * 	// ...
	 * }
	 * ```
	 *
	 * @param children Children views to be registered.
	 */ registerChild(children) {
        if (!isIterable(children)) {
            children = [
                children
            ];
        }
        for (const child of children){
            this._unboundChildren.add(child);
        }
    }
    /**
	 * The opposite of {@link #registerChild}. Removes a child view from this view instance.
	 * Once removed, the child is no longer managed by its parent, e.g. it can safely
	 * become a child of another parent view.
	 *
	 * @see #registerChild
	 * @param children Child views to be removed.
	 */ deregisterChild(children) {
        if (!isIterable(children)) {
            children = [
                children
            ];
        }
        for (const child of children){
            this._unboundChildren.remove(child);
        }
    }
    /**
	 * Sets the {@link #template} of the view with with given definition.
	 *
	 * A shorthand for:
	 *
	 * ```ts
	 * view.setTemplate( definition );
	 * ```
	 *
	 * @param definition Definition of view's template.
	 */ setTemplate(definition) {
        this.template = new Template(definition);
    }
    /**
	 * {@link module:ui/template~Template.extend Extends} the {@link #template} of the view with
	 * with given definition.
	 *
	 * A shorthand for:
	 *
	 * ```ts
	 * Template.extend( view.template, definition );
	 * ```
	 *
	 * **Note**: Is requires the {@link #template} to be already set. See {@link #setTemplate}.
	 *
	 * @param definition Definition which extends the {@link #template}.
	 */ extendTemplate(definition) {
        Template.extend(this.template, definition);
    }
    /**
	 * Recursively renders the view.
	 *
	 * Once the view is rendered:
	 * * the {@link #element} becomes an HTML element out of {@link #template},
	 * * the {@link #isRendered} flag is set `true`.
	 *
	 * **Note**: The children of the view:
	 * * defined directly in the {@link #template}
	 * * residing in collections created by the {@link #createCollection} method,
	 * * and added by {@link #registerChild}
	 * are also rendered in the process.
	 *
	 * In general, `render()` method is the right place to keep the code which refers to the
	 * {@link #element} and should be executed at the very beginning of the view's life cycle.
	 *
	 * It is possible to {@link module:ui/template~Template.extend} the {@link #template} before
	 * the view is rendered. To allow an early customization of the view (e.g. by its parent),
	 * such references should be done in `render()`.
	 *
	 * ```ts
	 * class SampleView extends View {
	 * 	constructor() {
	 * 		this.setTemplate( {
	 * 			// ...
	 * 		} );
	 * 	},
	 *
	 * 	render() {
	 * 		// View#element becomes available.
	 * 		super.render();
	 *
	 * 		// The "scroll" listener depends on #element.
	 * 		this.listenTo( window, 'scroll', () => {
	 * 			// A reference to #element would render the #template and make it non-extendable.
	 * 			if ( window.scrollY > 0 ) {
	 * 				this.element.scrollLeft = 100;
	 * 			} else {
	 * 				this.element.scrollLeft = 0;
	 * 			}
	 * 		} );
	 * 	}
	 * }
	 *
	 * const view = new SampleView();
	 *
	 * // Let's customize the view before it gets rendered.
	 * view.extendTemplate( {
	 * 	attributes: {
	 * 		class: [
	 * 			'additional-class'
	 * 		]
	 * 	}
	 * } );
	 *
	 * // Late rendering allows customization of the view.
	 * view.render();
	 * ```
	 */ render() {
        if (this.isRendered) {
            /**
			 * This View has already been rendered.
			 *
			 * @error ui-view-render-already-rendered
			 */ throw new CKEditorError('ui-view-render-already-rendered', this);
        }
        // Render #element of the view.
        if (this.template) {
            this.element = this.template.render();
            // Auto–register view children from #template.
            this.registerChild(this.template.getViews());
        }
        this.isRendered = true;
    }
    /**
	 * Recursively destroys the view instance and child views added by {@link #registerChild} and
	 * residing in collections created by the {@link #createCollection}.
	 *
	 * Destruction disables all event listeners:
	 * * created on the view, e.g. `view.on( 'event', () => {} )`,
	 * * defined in the {@link #template} for DOM events.
	 */ destroy() {
        this.stopListening();
        this._viewCollections.map((c)=>c.destroy());
        // Template isn't obligatory for views.
        if (this.template && this.template._revertData) {
            this.template.revert(this.element);
        }
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/clickoutsidehandler
 */ /* global document */ /**
 * Handles clicking **outside** of a specified set of elements, then fires an action.
 *
 * **Note**: Actually, the action is executed upon `mousedown`, not `click`. It prevents
 * certain issues when the user keeps holding the mouse button and the UI cannot react
 * properly.
 *
 * @param options Configuration options.
 * @param options.emitter The emitter to which this behavior should be added.
 * @param options.activator Function returning a `Boolean`, to determine whether the handler is active.
 * @param options.contextElements Array of HTML elements or a callback returning an array of HTML elements
 * that determine the scope of the handler. Clicking any of them or their descendants will **not** fire the callback.
 * @param options.callback An action executed by the handler.
 */ function clickOutsideHandler({ emitter, activator, callback, contextElements }) {
    emitter.listenTo(document, 'mousedown', (evt, domEvt)=>{
        if (!activator()) {
            return;
        }
        // Check if `composedPath` is `undefined` in case the browser does not support native shadow DOM.
        // Can be removed when all supported browsers support native shadow DOM.
        const path = typeof domEvt.composedPath == 'function' ? domEvt.composedPath() : [];
        const contextElementsList = typeof contextElements == 'function' ? contextElements() : contextElements;
        for (const contextElement of contextElementsList){
            if (contextElement.contains(domEvt.target) || path.includes(contextElement)) {
                return;
            }
        }
        callback();
    });
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/injectcsstransitiondisabler
 */ /**
 * A decorator that brings the possibility to temporarily disable CSS transitions using
 * {@link module:ui/view~View} methods. It is helpful when, for instance, the transitions should not happen
 * when the view is first displayed but they should work normal in other cases.
 *
 * The methods to control the CSS transitions are:
 * * `disableCssTransitions()` – Adds the `.ck-transitions-disabled` class to the
 * {@link module:ui/view~View#element view element}.
 * * `enableCssTransitions()` – Removes the `.ck-transitions-disabled` class from the
 * {@link module:ui/view~View#element view element}.
 *
 * **Note**: This helper extends the {@link module:ui/view~View#template template} and must be used **after**
 * {@link module:ui/view~View#setTemplate} is called:
 *
 * ```ts
 * import injectCssTransitionDisabler from '@ckeditor/ckeditor5-ui/src/bindings/injectcsstransitiondisabler';
 *
 * class MyView extends View {
 * 	constructor() {
 * 		super();
 *
 * 		// ...
 *
 * 		this.setTemplate( { ... } );
 *
 * 		// ...
 *
 * 		injectCssTransitionDisabler( this );
 *
 * 		// ...
 * 	}
 * }
 * ```
 *
 * The usage comes down to:
 *
 * ```ts
 * const view = new MyView();
 *
 * // ...
 *
 * view.disableCssTransitions();
 * view.show();
 * view.enableCssTransitions();
 * ```
 *
 * @deprecated
 * @see module:ui/bindings/csstransitiondisablermixin~CssTransitionDisablerMixin
 * @param view View instance that should get this functionality.
 */ function injectCssTransitionDisabler(view) {
    const decorated = view;
    decorated.set('_isCssTransitionsDisabled', false);
    decorated.disableCssTransitions = ()=>{
        decorated._isCssTransitionsDisabled = true;
    };
    decorated.enableCssTransitions = ()=>{
        decorated._isCssTransitionsDisabled = false;
    };
    decorated.extendTemplate({
        attributes: {
            class: [
                decorated.bindTemplate.if('_isCssTransitionsDisabled', 'ck-transitions-disabled')
            ]
        }
    });
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/csstransitiondisablermixin
 */ /**
 * A mixin that brings the possibility to temporarily disable CSS transitions using
 * {@link module:ui/view~View} methods. It is helpful when, for instance, the transitions should not happen
 * when the view is first displayed but they should work normal in other cases.
 *
 * The methods to control the CSS transitions are:
 * * `disableCssTransitions()` – Adds the `.ck-transitions-disabled` class to the
 * {@link module:ui/view~View#element view element}.
 * * `enableCssTransitions()` – Removes the `.ck-transitions-disabled` class from the
 * {@link module:ui/view~View#element view element}.
 *
 * The usage comes down to:
 *
 * ```ts
 * const MyViewWithCssTransitionDisabler = CssTransitionDisablerMixin( MyView );
 * const view = new MyViewWithCssTransitionDisabler();
 *
 * // ...
 *
 * view.disableCssTransitions();
 * view.show();
 * view.enableCssTransitions();
 * ```
 *
 * @param view View instance that should get this functionality.
 */ function CssTransitionDisablerMixin(view) {
    class Mixin extends view {
        disableCssTransitions() {
            this._isCssTransitionsDisabled = true;
        }
        enableCssTransitions() {
            this._isCssTransitionsDisabled = false;
        }
        constructor(...args){
            super(...args);
            this.set('_isCssTransitionsDisabled', false);
            this.initializeCssTransitionDisablerMixin();
        }
        initializeCssTransitionDisablerMixin() {
            this.extendTemplate({
                attributes: {
                    class: [
                        this.bindTemplate.if('_isCssTransitionsDisabled', 'ck-transitions-disabled')
                    ]
                }
            });
        }
    }
    return Mixin;
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/submithandler
 */ /**
 * A handler useful for {@link module:ui/view~View views} working as HTML forms. It intercepts a native DOM
 * `submit` event, prevents the default web browser behavior (navigation and page reload) and
 * fires the `submit` event on a view instead. Such a custom event can be then used by any
 * {@link module:utils/dom/emittermixin~DomEmitter emitter}, e.g. to serialize the form data.
 *
 * ```ts
 * import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';
 *
 * // ...
 *
 * class AnyFormView extends View {
 * 	constructor() {
 * 		super();
 *
 * 		// ...
 *
 * 		submitHandler( {
 * 			view: this
 * 		} );
 * 	}
 * }
 *
 * // ...
 *
 * const view = new AnyFormView();
 *
 * // A sample listener attached by an emitter working with the view.
 * this.listenTo( view, 'submit', () => {
 * 	saveTheFormData();
 * 	hideTheForm();
 * } );
 * ```
 *
 * @param options Configuration options.
 * @param options.view The view which DOM `submit` events should be handled.
 */ function submitHandler({ view }) {
    view.listenTo(view.element, 'submit', (evt, domEvt)=>{
        domEvt.preventDefault();
        view.fire('submit');
    }, {
        useCapture: true
    });
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/addkeyboardhandlingforgrid
 */ /**
 * A helper that adds a keyboard navigation support (arrow up/down/left/right) for grids.
 *
 * @param options Configuration options.
 * @param options.keystrokeHandler Keystroke handler to register navigation with arrow keys.
 * @param options.focusTracker A focus tracker for grid elements.
 * @param options.gridItems A collection of grid items.
 * @param options.numberOfColumns Number of columns in the grid. Can be specified as a function that returns
 * the number (e.g. for responsive grids).
 * @param options.uiLanguageDirection String of ui language direction.
 */ function addKeyboardHandlingForGrid({ keystrokeHandler, focusTracker, gridItems, numberOfColumns, uiLanguageDirection }) {
    const getNumberOfColumns = typeof numberOfColumns === 'number' ? ()=>numberOfColumns : numberOfColumns;
    keystrokeHandler.set('arrowright', getGridItemFocuser((focusedElementIndex, gridItems)=>{
        return uiLanguageDirection === 'rtl' ? getLeftElementIndex(focusedElementIndex, gridItems.length) : getRightElementIndex(focusedElementIndex, gridItems.length);
    }));
    keystrokeHandler.set('arrowleft', getGridItemFocuser((focusedElementIndex, gridItems)=>{
        return uiLanguageDirection === 'rtl' ? getRightElementIndex(focusedElementIndex, gridItems.length) : getLeftElementIndex(focusedElementIndex, gridItems.length);
    }));
    keystrokeHandler.set('arrowup', getGridItemFocuser((focusedElementIndex, gridItems)=>{
        let nextIndex = focusedElementIndex - getNumberOfColumns();
        if (nextIndex < 0) {
            nextIndex = focusedElementIndex + getNumberOfColumns() * Math.floor(gridItems.length / getNumberOfColumns());
            if (nextIndex > gridItems.length - 1) {
                nextIndex -= getNumberOfColumns();
            }
        }
        return nextIndex;
    }));
    keystrokeHandler.set('arrowdown', getGridItemFocuser((focusedElementIndex, gridItems)=>{
        let nextIndex = focusedElementIndex + getNumberOfColumns();
        if (nextIndex > gridItems.length - 1) {
            nextIndex = focusedElementIndex % getNumberOfColumns();
        }
        return nextIndex;
    }));
    function getGridItemFocuser(getIndexToFocus) {
        return (evt)=>{
            const focusedElement = gridItems.find((item)=>item.element === focusTracker.focusedElement);
            const focusedElementIndex = gridItems.getIndex(focusedElement);
            const nextIndexToFocus = getIndexToFocus(focusedElementIndex, gridItems);
            gridItems.get(nextIndexToFocus).focus();
            evt.stopPropagation();
            evt.preventDefault();
        };
    }
    /**
	 * Function returning the next index.
	 *
	 * ```
	 * before: [ ][x][ ]	after: [ ][ ][x]
	 * index = 1            index = 2
	 * ```
	 *
	 * If current index is last, function returns first index.
	 *
	 * ```
	 * before: [ ][ ][x]	after: [x][ ][ ]
	 * index = 2            index = 0
	 * ```
	 *
	 * @param elementIndex Number of current index.
	 * @param collectionLength A count of collection items.
	 */ function getRightElementIndex(elementIndex, collectionLength) {
        if (elementIndex === collectionLength - 1) {
            return 0;
        } else {
            return elementIndex + 1;
        }
    }
    /**
	 * Function returning the previous index.
	 *
	 * ```
	 * before: [ ][x][ ]	after: [x][ ][ ]
	 * index = 1            index = 0
	 * ```
	 *
	 * If current index is first, function returns last index.
	 *
	 * ```
	 * before: [x][ ][ ]	after: [ ][ ][x]
	 * index = 0            index = 2
	 * ```
	 *
	 * @param elementIndex Number of current index.
	 * @param collectionLength A count of collection items.
	 */ function getLeftElementIndex(elementIndex, collectionLength) {
        if (elementIndex === 0) {
            return collectionLength - 1;
        } else {
            return elementIndex - 1;
        }
    }
}

/**
 * The icon view class.
 */ class IconView extends View {
    /**
	 * A list of presentational attributes that can be set on the `<svg>` element and should be preserved
	 * when the icon {@link module:ui/icon/iconview~IconView#content content} is loaded.
	 *
	 * See the [specification](https://www.w3.org/TR/SVG/styling.html#TermPresentationAttribute) to learn more.
	 */ static presentationalAttributeNames = [
        'alignment-baseline',
        'baseline-shift',
        'clip-path',
        'clip-rule',
        'color',
        'color-interpolation',
        'color-interpolation-filters',
        'color-rendering',
        'cursor',
        'direction',
        'display',
        'dominant-baseline',
        'fill',
        'fill-opacity',
        'fill-rule',
        'filter',
        'flood-color',
        'flood-opacity',
        'font-family',
        'font-size',
        'font-size-adjust',
        'font-stretch',
        'font-style',
        'font-variant',
        'font-weight',
        'image-rendering',
        'letter-spacing',
        'lighting-color',
        'marker-end',
        'marker-mid',
        'marker-start',
        'mask',
        'opacity',
        'overflow',
        'paint-order',
        'pointer-events',
        'shape-rendering',
        'stop-color',
        'stop-opacity',
        'stroke',
        'stroke-dasharray',
        'stroke-dashoffset',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-miterlimit',
        'stroke-opacity',
        'stroke-width',
        'text-anchor',
        'text-decoration',
        'text-overflow',
        'text-rendering',
        'transform',
        'unicode-bidi',
        'vector-effect',
        'visibility',
        'white-space',
        'word-spacing',
        'writing-mode'
    ];
    /**
	 * @inheritDoc
	 */ constructor(){
        super();
        const bind = this.bindTemplate;
        this.set('content', '');
        this.set('viewBox', '0 0 20 20');
        this.set('fillColor', '');
        this.set('isColorInherited', true);
        this.set('isVisible', true);
        this.setTemplate({
            tag: 'svg',
            ns: 'http://www.w3.org/2000/svg',
            attributes: {
                class: [
                    'ck',
                    'ck-icon',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value),
                    // Exclude icon internals from the CSS reset to allow rich (non-monochromatic) icons
                    // (https://github.com/ckeditor/ckeditor5/issues/12599).
                    'ck-reset_all-excluded',
                    // The class to remove the dynamic color inheritance is toggleable
                    // (https://github.com/ckeditor/ckeditor5/issues/12599).
                    bind.if('isColorInherited', 'ck-icon_inherit-color')
                ],
                viewBox: bind.to('viewBox')
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this._updateXMLContent();
        this._colorFillPaths();
        // This is a hack for lack of innerHTML binding.
        // See: https://github.com/ckeditor/ckeditor5-ui/issues/99.
        this.on('change:content', ()=>{
            this._updateXMLContent();
            this._colorFillPaths();
        });
        this.on('change:fillColor', ()=>{
            this._colorFillPaths();
        });
    }
    /**
	 * Updates the {@link #element} with the value of {@link #content}.
	 */ _updateXMLContent() {
        if (this.content) {
            const parsed = new DOMParser().parseFromString(this.content.trim(), 'image/svg+xml');
            const svg = parsed.querySelector('svg');
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                this.viewBox = viewBox;
            }
            // Preserve presentational attributes of the <svg> element from the source.
            // They can affect rendering of the entire icon (https://github.com/ckeditor/ckeditor5/issues/12597).
            for (const { name, value } of Array.from(svg.attributes)){
                if (IconView.presentationalAttributeNames.includes(name)) {
                    this.element.setAttribute(name, value);
                }
            }
            while(this.element.firstChild){
                this.element.removeChild(this.element.firstChild);
            }
            while(svg.childNodes.length > 0){
                this.element.appendChild(svg.childNodes[0]);
            }
        }
    }
    /**
	 * Fills all child `path.ck-icon__fill` with the `#fillColor`.
	 */ _colorFillPaths() {
        if (this.fillColor) {
            this.element.querySelectorAll('.ck-icon__fill').forEach((path)=>{
                path.style.fill = this.fillColor;
            });
        }
    }
}

/**
 * A default implementation of the button view's label. It comes with a dynamic text support
 * via {@link module:ui/button/buttonlabelview~ButtonLabelView#text} property.
 */ class ButtonLabelView extends View {
    /**
	 * @inheritDoc
	 */ constructor(){
        super();
        this.set({
            style: undefined,
            text: undefined,
            id: undefined
        });
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-button__label'
                ],
                style: bind.to('style'),
                id: bind.to('id')
            },
            children: [
                {
                    text: bind.to('text')
                }
            ]
        });
    }
}

/**
 * The button view class.
 *
 * ```ts
 * const view = new ButtonView();
 *
 * view.set( {
 * 	label: 'A button',
 * 	keystroke: 'Ctrl+B',
 * 	tooltip: true,
 * 	withText: true
 * } );
 *
 * view.render();
 *
 * document.body.append( view.element );
 * ```
 */ class ButtonView extends View {
    /**
	 * Collection of the child views inside of the button {@link #element}.
	 */ children;
    /**
	 * Label of the button view. Its text is configurable using the {@link #label label attribute}.
	 *
	 * If not configured otherwise in the `constructor()`, by default the label is an instance
	 * of {@link module:ui/button/buttonlabelview~ButtonLabelView}.
	 */ labelView;
    /**
	 * The icon view of the button. Will be added to {@link #children} when the
	 * {@link #icon icon attribute} is defined.
	 */ iconView;
    /**
	 * A view displaying the keystroke of the button next to the {@link #labelView label}.
	 * Added to {@link #children} when the {@link #withKeystroke `withKeystroke` attribute}
	 * is defined.
	 */ keystrokeView;
    /**
	 * Delayed focus function for focus handling in Safari.
	 */ _focusDelayed = null;
    /**
	 * Creates an instance of the button view class.
	 *
	 * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
	 * @param labelView The instance of the button's label. If not provided, an instance of
	 * {@link module:ui/button/buttonlabelview~ButtonLabelView} is used.
	 */ constructor(locale, labelView = new ButtonLabelView()){
        super(locale);
        const bind = this.bindTemplate;
        const ariaLabelUid = uid();
        // Implement the Button interface.
        this.set('ariaLabel', undefined);
        this.set('ariaLabelledBy', `ck-editor__aria-label_${ariaLabelUid}`);
        this.set('class', undefined);
        this.set('labelStyle', undefined);
        this.set('icon', undefined);
        this.set('isEnabled', true);
        this.set('isOn', false);
        this.set('isVisible', true);
        this.set('isToggleable', false);
        this.set('keystroke', undefined);
        this.set('label', undefined);
        this.set('role', undefined);
        this.set('tabindex', -1);
        this.set('tooltip', false);
        this.set('tooltipPosition', 's');
        this.set('type', 'button');
        this.set('withText', false);
        this.set('withKeystroke', false);
        this.children = this.createCollection();
        this.labelView = this._setupLabelView(labelView);
        this.iconView = new IconView();
        this.iconView.extendTemplate({
            attributes: {
                class: 'ck-button__icon'
            }
        });
        this.keystrokeView = this._createKeystrokeView();
        this.bind('_tooltipString').to(this, 'tooltip', this, 'label', this, 'keystroke', this._getTooltipString.bind(this));
        const template = {
            tag: 'button',
            attributes: {
                class: [
                    'ck',
                    'ck-button',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', (value)=>!value),
                    bind.if('isVisible', 'ck-hidden', (value)=>!value),
                    bind.to('isOn', (value)=>value ? 'ck-on' : 'ck-off'),
                    bind.if('withText', 'ck-button_with-text'),
                    bind.if('withKeystroke', 'ck-button_with-keystroke')
                ],
                role: bind.to('role'),
                type: bind.to('type', (value)=>value ? value : 'button'),
                tabindex: bind.to('tabindex'),
                'aria-checked': bind.to('ariaChecked'),
                'aria-label': bind.to('ariaLabel'),
                'aria-labelledby': bind.to('ariaLabelledBy'),
                'aria-disabled': bind.if('isEnabled', true, (value)=>!value),
                'aria-pressed': bind.to('isOn', (value)=>this.isToggleable ? String(!!value) : false),
                'data-cke-tooltip-text': bind.to('_tooltipString'),
                'data-cke-tooltip-position': bind.to('tooltipPosition')
            },
            children: this.children,
            on: {
                click: bind.to((evt)=>{
                    // We can't make the button disabled using the disabled attribute, because it won't be focusable.
                    // Though, shouldn't this condition be moved to the button controller?
                    if (this.isEnabled) {
                        this.fire('execute');
                    } else {
                        // Prevent the default when button is disabled, to block e.g.
                        // automatic form submitting. See ckeditor/ckeditor5-link#74.
                        evt.preventDefault();
                    }
                })
            }
        };
        // On Safari we have to force the focus on a button on click as it's the only browser
        // that doesn't do that automatically. See #12115.
        if (env.isSafari) {
            if (!this._focusDelayed) {
                this._focusDelayed = delay(()=>this.focus(), 0);
            }
            template.on.mousedown = bind.to(()=>{
                this._focusDelayed();
            });
            template.on.mouseup = bind.to(()=>{
                this._focusDelayed.cancel();
            });
        }
        this.setTemplate(template);
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        if (this.icon) {
            this.iconView.bind('content').to(this, 'icon');
            this.children.add(this.iconView);
        }
        this.children.add(this.labelView);
        if (this.withKeystroke && this.keystroke) {
            this.children.add(this.keystrokeView);
        }
    }
    /**
	 * Focuses the {@link #element} of the button.
	 */ focus() {
        this.element.focus();
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        if (this._focusDelayed) {
            this._focusDelayed.cancel();
        }
        super.destroy();
    }
    /**
	 * Binds the label view instance it with button attributes.
	 */ _setupLabelView(labelView) {
        labelView.bind('text', 'style', 'id').to(this, 'label', 'labelStyle', 'ariaLabelledBy');
        return labelView;
    }
    /**
	 * Creates a view that displays a keystroke next to a {@link #labelView label }
	 * and binds it with button attributes.
	 */ _createKeystrokeView() {
        const keystrokeView = new View();
        keystrokeView.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-button__keystroke'
                ]
            },
            children: [
                {
                    text: this.bindTemplate.to('keystroke', (text)=>getEnvKeystrokeText(text))
                }
            ]
        });
        return keystrokeView;
    }
    /**
	 * Gets the text for the tooltip from the combination of
	 * {@link #tooltip}, {@link #label} and {@link #keystroke} attributes.
	 *
	 * @see #tooltip
	 * @see #_tooltipString
	 * @param tooltip Button tooltip.
	 * @param label Button label.
	 * @param keystroke Button keystroke.
	 */ _getTooltipString(tooltip, label, keystroke) {
        if (tooltip) {
            if (typeof tooltip == 'string') {
                return tooltip;
            } else {
                if (keystroke) {
                    keystroke = getEnvKeystrokeText(keystroke);
                }
                if (tooltip instanceof Function) {
                    return tooltip(label, keystroke);
                } else {
                    return `${label}${keystroke ? ` (${keystroke})` : ''}`;
                }
            }
        }
        return '';
    }
}

/**
 * The class component representing a form header view. It should be used in more advanced forms to
 * describe the main purpose of the form.
 *
 * By default the component contains a bolded label view that has to be set. The label is usually a short (at most 3-word) string.
 * The component can also be extended by any other elements, like: icons, dropdowns, etc.
 *
 * It is used i.a.
 * by {@link module:table/tablecellproperties/ui/tablecellpropertiesview~TableCellPropertiesView}
 * and {@link module:special-characters/ui/specialcharactersnavigationview~SpecialCharactersNavigationView}.
 *
 * The latter is an example, where the component has been extended by {@link module:ui/dropdown/dropdownview~DropdownView} view.
 */ class FormHeaderView extends View {
    /**
	 * A collection of header items.
	 */ children;
    /**
	 * The icon view instance. Defined only if icon was passed in the constructor's options.
	 */ iconView;
    /**
	 * Creates an instance of the form header class.
	 *
	 * @param locale The locale instance.
	 * @param options.label A label.
	 * @param options.class An additional class.
	 */ constructor(locale, options = {}){
        super(locale);
        const bind = this.bindTemplate;
        this.set('label', options.label || '');
        this.set('class', options.class || null);
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-form__header',
                    bind.to('class')
                ]
            },
            children: this.children
        });
        if (options.icon) {
            this.iconView = new IconView();
            this.iconView.content = options.icon;
            this.children.add(this.iconView);
        }
        const label = new View(locale);
        label.setTemplate({
            tag: 'h2',
            attributes: {
                class: [
                    'ck',
                    'ck-form__header__label'
                ],
                role: 'presentation'
            },
            children: [
                {
                    text: bind.to('label')
                }
            ]
        });
        this.children.add(label);
    }
}

/**
 * A utility class that helps cycling over {@link module:ui/focuscycler~FocusableView focusable views} in a
 * {@link module:ui/viewcollection~ViewCollection} when the focus is tracked by the
 * {@link module:utils/focustracker~FocusTracker} instance. It helps implementing keyboard
 * navigation in HTML forms, toolbars, lists and the like.
 *
 * To work properly it requires:
 * * a collection of focusable (HTML `tabindex` attribute) views that implement the `focus()` method,
 * * an associated focus tracker to determine which view is focused.
 *
 * A simple cycler setup can look like this:
 *
 * ```ts
 * const focusables = new ViewCollection<FocusableView>();
 * const focusTracker = new FocusTracker();
 *
 * // Add focusable views to the focus tracker.
 * focusTracker.add( ... );
 * ```
 *
 * Then, the cycler can be used manually:
 *
 * ```ts
 * const cycler = new FocusCycler( { focusables, focusTracker } );
 *
 * // Will focus the first focusable view in #focusables.
 * cycler.focusFirst();
 *
 * // Will log the next focusable item in #focusables.
 * console.log( cycler.next );
 * ```
 *
 * Alternatively, it can work side by side with the {@link module:utils/keystrokehandler~KeystrokeHandler}:
 *
 * ```ts
 * const keystrokeHandler = new KeystrokeHandler();
 *
 * // Activate the keystroke handler.
 * keystrokeHandler.listenTo( sourceOfEvents );
 *
 * const cycler = new FocusCycler( {
 * 	focusables, focusTracker, keystrokeHandler,
 * 	actions: {
 * 		// When arrowup of arrowleft is detected by the #keystrokeHandler,
 * 		// focusPrevious() will be called on the cycler.
 * 		focusPrevious: [ 'arrowup', 'arrowleft' ],
 * 	}
 * } );
 * ```
 *
 * Check out the {@glink framework/deep-dive/ui/focus-tracking "Deep dive into focus tracking"} guide to learn more.
 */ class FocusCycler extends /* #__PURE__ */ EmitterMixin() {
    /**
	 * A {@link module:ui/focuscycler~FocusableView focusable views} collection that the cycler operates on.
	 */ focusables;
    /**
	 * A focus tracker instance that the cycler uses to determine the current focus
	 * state in {@link #focusables}.
	 */ focusTracker;
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}
	 * which can respond to certain keystrokes and cycle the focus.
	 */ keystrokeHandler;
    /**
	 * Actions that the cycler can take when a keystroke is pressed. Requires
	 * `options.keystrokeHandler` to be passed and working. When an action is
	 * performed, `preventDefault` and `stopPropagation` will be called on the event
	 * the keystroke fired in the DOM.
	 *
	 * ```ts
	 * actions: {
	 * 	// Will call #focusPrevious() when arrowleft or arrowup is pressed.
	 * 	focusPrevious: [ 'arrowleft', 'arrowup' ],
	 *
	 * 	// Will call #focusNext() when arrowdown is pressed.
	 * 	focusNext: 'arrowdown'
	 * }
	 * ```
	 */ actions;
    /**
	 * Creates an instance of the focus cycler utility.
	 *
	 * @param options Configuration options.
	 */ constructor(options){
        super();
        this.focusables = options.focusables;
        this.focusTracker = options.focusTracker;
        this.keystrokeHandler = options.keystrokeHandler;
        this.actions = options.actions;
        if (options.actions && options.keystrokeHandler) {
            for(const methodName in options.actions){
                let actions = options.actions[methodName];
                if (typeof actions == 'string') {
                    actions = [
                        actions
                    ];
                }
                for (const keystroke of actions){
                    options.keystrokeHandler.set(keystroke, (data, cancel)=>{
                        this[methodName]();
                        cancel();
                    });
                }
            }
        }
        this.on('forwardCycle', ()=>this.focusFirst(), {
            priority: 'low'
        });
        this.on('backwardCycle', ()=>this.focusLast(), {
            priority: 'low'
        });
    }
    /**
	 * Returns the first focusable view in {@link #focusables}.
	 * Returns `null` if there is none.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ get first() {
        return this.focusables.find(isDomFocusable) || null;
    }
    /**
	 * Returns the last focusable view in {@link #focusables}.
	 * Returns `null` if there is none.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ get last() {
        return this.focusables.filter(isDomFocusable).slice(-1)[0] || null;
    }
    /**
	 * Returns the next focusable view in {@link #focusables} based on {@link #current}.
	 * Returns `null` if there is none.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ get next() {
        return this._getDomFocusableItem(1);
    }
    /**
	 * Returns the previous focusable view in {@link #focusables} based on {@link #current}.
	 * Returns `null` if there is none.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ get previous() {
        return this._getDomFocusableItem(-1);
    }
    /**
	 * An index of the view in the {@link #focusables} which is focused according
	 * to {@link #focusTracker}. Returns `null` when there is no such view.
	 */ get current() {
        let index = null;
        // There's no focused view in the focusables.
        if (this.focusTracker.focusedElement === null) {
            return null;
        }
        this.focusables.find((view, viewIndex)=>{
            const focused = view.element === this.focusTracker.focusedElement;
            if (focused) {
                index = viewIndex;
            }
            return focused;
        });
        return index;
    }
    /**
	 * Focuses the {@link #first} item in {@link #focusables}.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ focusFirst() {
        this._focus(this.first, 1);
    }
    /**
	 * Focuses the {@link #last} item in {@link #focusables}.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ focusLast() {
        this._focus(this.last, -1);
    }
    /**
	 * Focuses the {@link #next} item in {@link #focusables}.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ focusNext() {
        const next = this.next;
        // If there's only one focusable item, we need to let the outside world know
        // that the next cycle is about to happen. This may be useful
        // e.g. if you want to move the focus to the parent focus cycler.
        // Note that the focus is not actually moved in this case.
        if (next && this.focusables.getIndex(next) === this.current) {
            this.fire('forwardCycle');
            return;
        }
        if (next === this.first) {
            this.fire('forwardCycle');
        } else {
            this._focus(next, 1);
        }
    }
    /**
	 * Focuses the {@link #previous} item in {@link #focusables}.
	 *
	 * **Note**: Hidden views (e.g. with `display: none`) are ignored.
	 */ focusPrevious() {
        const previous = this.previous;
        if (previous && this.focusables.getIndex(previous) === this.current) {
            this.fire('backwardCycle');
            return;
        }
        if (previous === this.last) {
            this.fire('backwardCycle');
        } else {
            this._focus(previous, -1);
        }
    }
    /**
	 * Focuses the given view if it exists.
	 *
	 * @param view The view to be focused
	 * @param direction The direction of the focus if the view has focusable children.
	 * @returns
	 */ _focus(view, direction) {
        // Don't fire focus events if the view is already focused.
        // Such attempt may occur when cycling with only one focusable item:
        // even though `focusNext()` method returns without changing focus,
        // the `forwardCycle` event is fired, triggering the `focusFirst()` method.
        if (view && this.focusTracker.focusedElement !== view.element) {
            view.focus(direction);
        }
    }
    /**
	 * Returns the next or previous focusable view in {@link #focusables} with respect
	 * to {@link #current}.
	 *
	 * @param step Either `1` for checking forward from {@link #current} or `-1` for checking backwards.
	 */ _getDomFocusableItem(step) {
        // Cache for speed.
        const collectionLength = this.focusables.length;
        if (!collectionLength) {
            return null;
        }
        const current = this.current;
        // Start from the beginning if no view is focused.
        // https://github.com/ckeditor/ckeditor5-ui/issues/206
        if (current === null) {
            return this[step === 1 ? 'first' : 'last'];
        }
        // Note: If current is the only focusable view, it will also be returned for the given step.
        let focusableItem = this.focusables.get(current);
        // Cycle in both directions.
        let index = (current + collectionLength + step) % collectionLength;
        do {
            const focusableItemCandidate = this.focusables.get(index);
            if (isDomFocusable(focusableItemCandidate)) {
                focusableItem = focusableItemCandidate;
                break;
            }
            // Cycle in both directions.
            index = (index + collectionLength + step) % collectionLength;
        }while (index !== current)
        return focusableItem;
    }
}
/**
 * Checks whether a view can be focused (has `focus()` method and is visible).
 *
 * @param view A view to be checked.
 */ function isDomFocusable(view) {
    return isFocusable(view) && isVisible(view.element);
}
/**
 * Checks whether a view is {@link ~FocusableView}.
 *
 * @param view A view to be checked.
 */ function isFocusable(view) {
    return !!('focus' in view && typeof view.focus == 'function');
}
/**
 * Checks whether a view is an instance of {@link ~ViewWithFocusCycler}.
 *
 * @param view A view to be checked.
 */ function isViewWithFocusCycler(view) {
    return isFocusable(view) && 'focusCycler' in view && view.focusCycler instanceof FocusCycler;
}

/**
 * A mixin that brings the possibility to observe dragging of the view element.
 * The view has to implement the {@link ~DraggableView} interface to use it:
 *
 * ```js
 * export default class MyDraggableView extends DraggableViewMixin( View ) implements DraggableView {
 * 		// ...
 * }
 * ```
 *
 * Creating a class extending it attaches a set of mouse and touch listeners allowing to observe dragging of the view element:
 * * `mousedown` and `touchstart` on the view element - starting the dragging.
 * * `mousemove` and `touchmove` on the document - updating the view coordinates.
 * * `mouseup` and `touchend` on the document - stopping the dragging.
 *
 * The mixin itself does not provide a visual feedback (that is, the dragged element does not change its position) -
 * it is up to the developer to implement it.
 */ function DraggableViewMixin(view) {
    class DraggableMixin extends view {
        /**
		 * A bound version of {@link #_onDrag}.
		 */ _onDragBound = this._onDrag.bind(this);
        /**
		 * A bound version of {@link #_onDragEnd}.
		 */ _onDragEndBound = this._onDragEnd.bind(this);
        /**
		 * The last coordinates of the view. It is updated on every mouse move.
		 */ _lastDraggingCoordinates = {
            x: 0,
            y: 0
        };
        /**
		 * @inheritdoc
		 */ constructor(...args){
            super(...args);
            this.on('render', ()=>{
                this._attachListeners();
            });
            this.set('isDragging', false);
        }
        /**
		 * Attaches the listeners for the drag start.
		 */ _attachListeners() {
            this.listenTo(this.element, 'mousedown', this._onDragStart.bind(this));
            this.listenTo(this.element, 'touchstart', this._onDragStart.bind(this));
        }
        /**
		 * Attaches the listeners for the dragging and drag end.
		 */ _attachDragListeners() {
            this.listenTo(global.document, 'mouseup', this._onDragEndBound);
            this.listenTo(global.document, 'touchend', this._onDragEndBound);
            this.listenTo(global.document, 'mousemove', this._onDragBound);
            this.listenTo(global.document, 'touchmove', this._onDragBound);
        }
        /**
		 * Detaches the listeners after the drag end.
		 */ _detachDragListeners() {
            this.stopListening(global.document, 'mouseup', this._onDragEndBound);
            this.stopListening(global.document, 'touchend', this._onDragEndBound);
            this.stopListening(global.document, 'mousemove', this._onDragBound);
            this.stopListening(global.document, 'touchmove', this._onDragBound);
        }
        /**
		 * Starts the dragging listeners and sets the initial view coordinates.
		 */ _onDragStart(evt, domEvt) {
            if (!this._isHandleElementPressed(domEvt)) {
                return;
            }
            this._attachDragListeners();
            let x = 0;
            let y = 0;
            // If dragging is performed with a mouse, there is only one set of coordinates available.
            // But when using a touch device, there may be many of them, so use the coordinates from the first touch.
            if (domEvt instanceof MouseEvent) {
                x = domEvt.clientX;
                y = domEvt.clientY;
            } else {
                x = domEvt.touches[0].clientX;
                y = domEvt.touches[0].clientY;
            }
            this._lastDraggingCoordinates = {
                x,
                y
            };
            this.isDragging = true;
        }
        /**
		 * Updates the view coordinates and fires the `drag` event.
		 */ _onDrag(evt, domEvt) {
            // If dragging was stopped by some external intervention, stop listening.
            if (!this.isDragging) {
                this._detachDragListeners();
                return;
            }
            let newX = 0;
            let newY = 0;
            // If dragging is performed with a mouse, there is only one set of coordinates available.
            // But when using a touch device, there may be many of them, so use the coordinates from the first touch.
            if (domEvt instanceof MouseEvent) {
                newX = domEvt.clientX;
                newY = domEvt.clientY;
            } else {
                newX = domEvt.touches[0].clientX;
                newY = domEvt.touches[0].clientY;
            }
            // Prevents selection of text while dragging on Safari.
            domEvt.preventDefault();
            this.fire('drag', {
                deltaX: Math.round(newX - this._lastDraggingCoordinates.x),
                deltaY: Math.round(newY - this._lastDraggingCoordinates.y)
            });
            this._lastDraggingCoordinates = {
                x: newX,
                y: newY
            };
        }
        /**
		 * Stops the dragging and detaches the listeners.
		 */ _onDragEnd() {
            this._detachDragListeners();
            this.isDragging = false;
        }
        /**
		 * Checks if the drag handle element was pressed.
		 */ _isHandleElementPressed(domEvt) {
            if (!this.dragHandleElement) {
                return false;
            }
            return this.dragHandleElement === domEvt.target || domEvt.target instanceof HTMLElement && this.dragHandleElement.contains(domEvt.target);
        }
    }
    return DraggableMixin;
}

/**
 * A dialog actions view class. It contains button views which are used to execute dialog actions.
 */ class DialogActionsView extends View {
    /**
	 * A collection of button views.
	 */ children;
    /**
	 * A keystroke handler instance.
	 */ keystrokes;
    /**
	 * A focus cycler instance.
	 */ focusCycler;
    /**
	 * A focus tracker instance.
	 */ _focusTracker;
    /**
	 * A collection of focusable views.
	 */ _focusables;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.children = this.createCollection();
        this.keystrokes = new KeystrokeHandler();
        this._focusTracker = new FocusTracker();
        this._focusables = new ViewCollection();
        this.focusCycler = new FocusCycler({
            focusables: this._focusables,
            focusTracker: this._focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate form fields backwards using the Shift + Tab keystroke.
                focusPrevious: 'shift + tab',
                // Navigate form fields forwards using the Tab key.
                focusNext: 'tab'
            }
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-dialog__actions'
                ]
            },
            children: this.children
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.keystrokes.listenTo(this.element);
    }
    /**
	 * Creates the button views based on the given definitions.
	 * Then adds them to the {@link #children} collection and to the focus cycler.
	 */ setButtons(definitions) {
        for (const definition of definitions){
            const button = new ButtonView(this.locale);
            let property;
            button.on('execute', ()=>definition.onExecute());
            if (definition.onCreate) {
                definition.onCreate(button);
            }
            for(property in definition){
                if (property != 'onExecute' && property != 'onCreate') {
                    button.set(property, definition[property]);
                }
            }
            this.children.add(button);
        }
        this._updateFocusCyclableItems();
    }
    /**
	 * @inheritDoc
	 */ focus(direction) {
        if (direction === -1) {
            this.focusCycler.focusLast();
        } else {
            this.focusCycler.focusFirst();
        }
    }
    /**
	 * Adds all elements from the {@link #children} collection to the {@link #_focusables} collection
	 * and to the {@link #_focusTracker} instance.
	 */ _updateFocusCyclableItems() {
        Array.from(this.children).forEach((v)=>{
            this._focusables.add(v);
            this._focusTracker.add(v.element);
        });
    }
}

/**
 * A dialog content view class.
 */ class DialogContentView extends View {
    /**
	 * A collection of content items.
	 */ children;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-dialog__content'
                ]
            },
            children: this.children
        });
    }
    /**
	 * Removes all the child views.
	 */ reset() {
        while(this.children.length){
            this.children.remove(0);
        }
    }
}

// @if CK_DEBUG_DIALOG // const RectDrawer = require( '@ckeditor/ckeditor5-utils/tests/_utils/rectdrawer' ).default;
/**
 * Available dialog view positions:
 *
 * * `DialogViewPosition.SCREEN_CENTER` &ndash; A fixed position in the center of the screen.
 * * `DialogViewPosition.EDITOR_CENTER` &ndash; A dynamic position in the center of the editor editable area.
 * * `DialogViewPosition.EDITOR_TOP_SIDE` &ndash; A dynamic position at the top-right (for the left-to-right languages)
 * or top-left (for right-to-left languages) corner of the editor editable area.
 * * `DialogViewPosition.EDITOR_TOP_CENTER` &ndash; A dynamic position at the top-center of the editor editable area.
 * * `DialogViewPosition.EDITOR_BOTTOM_CENTER` &ndash; A dynamic position at the bottom-center of the editor editable area.
 * * `DialogViewPosition.EDITOR_ABOVE_CENTER` &ndash; A dynamic position centered above the editor editable area.
 * * `DialogViewPosition.EDITOR_BELOW_CENTER` &ndash; A dynamic position centered below the editor editable area.
 *
 * The position of a dialog is specified by a {@link module:ui/dialog/dialog~DialogDefinition#position `position` property} of a
 * definition passed to the {@link module:ui/dialog/dialog~Dialog#show} method.
 */ const DialogViewPosition = {
    SCREEN_CENTER: 'screen-center',
    EDITOR_CENTER: 'editor-center',
    EDITOR_TOP_SIDE: 'editor-top-side',
    EDITOR_TOP_CENTER: 'editor-top-center',
    EDITOR_BOTTOM_CENTER: 'editor-bottom-center',
    EDITOR_ABOVE_CENTER: 'editor-above-center',
    EDITOR_BELOW_CENTER: 'editor-below-center'
};
const toPx$6 = /* #__PURE__ */ toUnit('px');
/**
 * A dialog view class.
 */ class DialogView extends /* #__PURE__ */ DraggableViewMixin(View) {
    /**
	 * A collection of the child views inside of the dialog.
	 * A dialog can have 3 optional parts: header, content, and actions.
	 */ parts;
    /**
	 * A header view of the dialog. It is also a drag handle of the dialog.
	 */ headerView;
    /**
	 * A close button view. It is automatically added to the header view if present.
	 */ closeButtonView;
    /**
	 * A view with the action buttons available to the user.
	 */ actionsView;
    /**
	 * A default dialog element offset from the reference element (e.g. editor editable area).
	 */ static defaultOffset = 15;
    /**
	 * A view with the dialog content.
	 */ contentView;
    /**
	 * A keystroke handler instance.
	 */ keystrokes;
    /**
	 * A focus tracker instance.
	 */ focusTracker;
    /**
	 * A flag indicating if the dialog was moved manually. If so, its position
	 * will not be updated automatically upon window resize or document scroll.
	 */ wasMoved = false;
    /**
	 * A callback returning the DOM root that requested the dialog.
	 */ _getCurrentDomRoot;
    /**
	 * A callback returning the configured editor viewport offset.
	 */ _getViewportOffset;
    /**
	 * The list of the focusable elements inside the dialog view.
	 */ _focusables;
    /**
	 * The focus cycler instance.
	 */ _focusCycler;
    /**
	 * @inheritDoc
	 */ constructor(locale, { getCurrentDomRoot, getViewportOffset }){
        super(locale);
        const bind = this.bindTemplate;
        const t = locale.t;
        this.set('className', '');
        this.set('ariaLabel', t('Editor dialog'));
        this.set('isModal', false);
        this.set('position', DialogViewPosition.SCREEN_CENTER);
        this.set('_isVisible', false);
        this.set('_isTransparent', false);
        this.set('_top', 0);
        this.set('_left', 0);
        this._getCurrentDomRoot = getCurrentDomRoot;
        this._getViewportOffset = getViewportOffset;
        this.decorate('moveTo');
        this.parts = this.createCollection();
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this._focusables = new ViewCollection();
        this._focusCycler = new FocusCycler({
            focusables: this._focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate form fields backwards using the Shift + Tab keystroke.
                focusPrevious: 'shift + tab',
                // Navigate form fields forwards using the Tab key.
                focusNext: 'tab'
            }
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-dialog-overlay',
                    bind.if('isModal', 'ck-dialog-overlay__transparent', (isModal)=>!isModal),
                    bind.if('_isVisible', 'ck-hidden', (value)=>!value)
                ],
                // Prevent from editor losing focus when clicking on the modal overlay.
                tabindex: '-1'
            },
            children: [
                {
                    tag: 'div',
                    attributes: {
                        tabindex: '-1',
                        class: [
                            'ck',
                            'ck-dialog',
                            bind.to('className')
                        ],
                        role: 'dialog',
                        'aria-label': bind.to('ariaLabel'),
                        style: {
                            top: bind.to('_top', (top)=>toPx$6(top)),
                            left: bind.to('_left', (left)=>toPx$6(left)),
                            visibility: bind.if('_isTransparent', 'hidden')
                        }
                    },
                    children: this.parts
                }
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.keystrokes.set('Esc', (data, cancel)=>{
            this.fire('close', {
                source: 'escKeyPress'
            });
            cancel();
        });
        // Support for dragging the modal.
        this.on('drag', (evt, { deltaX, deltaY })=>{
            this.wasMoved = true;
            this.moveBy(deltaX, deltaY);
        });
        // Update dialog position upon window resize, if the position was not changed manually.
        this.listenTo(global.window, 'resize', ()=>{
            if (this._isVisible && !this.wasMoved) {
                this.updatePosition();
            }
        });
        // Update dialog position upon document scroll, if the position was not changed manually.
        this.listenTo(global.document, 'scroll', ()=>{
            if (this._isVisible && !this.wasMoved) {
                this.updatePosition();
            }
        });
        this.on('change:_isVisible', (evt, name, isVisible)=>{
            if (isVisible) {
                // Let the content render first, then apply the position. Otherwise, the calculated DOM Rects
                // will not reflect the final look of the dialog. Note that we're not using #_moveOffScreen() here because
                // it causes a violent movement of the viewport on iOS (because the dialog still keeps the DOM focus).
                this._isTransparent = true;
                // FYI: RAF is too short. We need to wait a bit longer.
                setTimeout(()=>{
                    this.updatePosition();
                    this._isTransparent = false;
                    // The view must get the focus after it gets visible. But this is only possible
                    // after the dialog is no longer transparent.
                    this.focus();
                }, 10);
            }
        });
        this.keystrokes.listenTo(this.element);
    }
    /**
	 * Returns the element that should be used as a drag handle.
	 */ get dragHandleElement() {
        if (this.headerView) {
            return this.headerView.element;
        } else {
            return null;
        }
    }
    /**
	 * Creates the dialog parts. Which of them are created depends on the arguments passed to the method.
	 * There are no rules regarding the dialog construction, that is, no part is mandatory.
	 * Each part can only be created once.
	 *
	 * @internal
	 */ setupParts({ icon, title, hasCloseButton = true, content, actionButtons }) {
        if (title) {
            this.headerView = new FormHeaderView(this.locale, {
                icon
            });
            if (hasCloseButton) {
                this.closeButtonView = this._createCloseButton();
                this.headerView.children.add(this.closeButtonView);
            }
            this.headerView.label = title;
            this.ariaLabel = title;
            this.parts.add(this.headerView, 0);
        }
        if (content) {
            // Normalize the content specified in the arguments.
            if (content instanceof View) {
                content = [
                    content
                ];
            }
            this.contentView = new DialogContentView(this.locale);
            this.contentView.children.addMany(content);
            this.parts.add(this.contentView);
        }
        if (actionButtons) {
            this.actionsView = new DialogActionsView(this.locale);
            this.actionsView.setButtons(actionButtons);
            this.parts.add(this.actionsView);
        }
        this._updateFocusCyclableItems();
    }
    /**
	 * Focuses the first focusable element inside the dialog.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Normalizes the passed coordinates to make sure the dialog view
	 * is displayed within the visible viewport and moves it there.
	 *
	 * @internal
	 */ moveTo(left, top) {
        const viewportRect = this._getViewportRect();
        const dialogRect = this._getDialogRect();
        // Don't let the dialog go beyond the right edge of the viewport.
        if (left + dialogRect.width > viewportRect.right) {
            left = viewportRect.right - dialogRect.width;
        }
        // Don't let the dialog go beyond the left edge of the viewport.
        if (left < viewportRect.left) {
            left = viewportRect.left;
        }
        // Don't let the dialog go beyond the top edge of the viewport.
        if (top < viewportRect.top) {
            top = viewportRect.top;
        }
        // Note: We don't do the same for the bottom edge to allow users to resize the window vertically
        // and let the dialog to stay put instead of covering the editing root.
        this._moveTo(left, top);
    }
    /**
	 * Moves the dialog to the specified coordinates.
	 */ _moveTo(left, top) {
        this._left = left;
        this._top = top;
    }
    /**
	 * Moves the dialog by the specified offset.
	 *
	 * @internal
	 */ moveBy(left, top) {
        this.moveTo(this._left + left, this._top + top);
    }
    /**
	 * Moves the dialog view to the off-screen position.
	 * Used when there is no space to display the dialog.
	 */ _moveOffScreen() {
        this._moveTo(-9999, -9999);
    }
    /**
	 * Recalculates the dialog according to the set position and viewport,
	 * and moves it to the new position.
	 */ updatePosition() {
        if (!this.element || !this.element.parentNode) {
            return;
        }
        const viewportRect = this._getViewportRect();
        // Actual position may be different from the configured one if there's no DOM root.
        let configuredPosition = this.position;
        let domRootRect;
        if (!this._getCurrentDomRoot()) {
            configuredPosition = DialogViewPosition.SCREEN_CENTER;
        } else {
            domRootRect = this._getVisibleDomRootRect(viewportRect);
        }
        const defaultOffset = DialogView.defaultOffset;
        const dialogRect = this._getDialogRect();
        // @if CK_DEBUG_DIALOG // RectDrawer.clear();
        // @if CK_DEBUG_DIALOG // RectDrawer.draw( viewportRect, { outlineColor: 'blue' }, 'Viewport' );
        switch(configuredPosition){
            case DialogViewPosition.EDITOR_TOP_SIDE:
                {
                    // @if CK_DEBUG_DIALOG // if ( domRootRect ) {
                    // @if CK_DEBUG_DIALOG // 	RectDrawer.draw( domRootRect, { outlineColor: 'red', zIndex: 9999999 }, 'DOM ROOT' );
                    // @if CK_DEBUG_DIALOG // }
                    if (domRootRect) {
                        const leftCoordinate = this.locale.contentLanguageDirection === 'ltr' ? domRootRect.right - dialogRect.width - defaultOffset : domRootRect.left + defaultOffset;
                        this.moveTo(leftCoordinate, domRootRect.top + defaultOffset);
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
            case DialogViewPosition.EDITOR_CENTER:
                {
                    if (domRootRect) {
                        this.moveTo(Math.round(domRootRect.left + domRootRect.width / 2 - dialogRect.width / 2), Math.round(domRootRect.top + domRootRect.height / 2 - dialogRect.height / 2));
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
            case DialogViewPosition.SCREEN_CENTER:
                {
                    this.moveTo(Math.round((viewportRect.width - dialogRect.width) / 2), Math.round((viewportRect.height - dialogRect.height) / 2));
                    break;
                }
            case DialogViewPosition.EDITOR_TOP_CENTER:
                {
                    // @if CK_DEBUG_DIALOG // if ( domRootRect ) {
                    // @if CK_DEBUG_DIALOG // 	RectDrawer.draw( domRootRect, { outlineColor: 'red', zIndex: 9999999 }, 'DOM ROOT' );
                    // @if CK_DEBUG_DIALOG // }
                    if (domRootRect) {
                        this.moveTo(Math.round(domRootRect.left + domRootRect.width / 2 - dialogRect.width / 2), domRootRect.top + defaultOffset);
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
            case DialogViewPosition.EDITOR_BOTTOM_CENTER:
                {
                    // @if CK_DEBUG_DIALOG // if ( domRootRect ) {
                    // @if CK_DEBUG_DIALOG // 	RectDrawer.draw( domRootRect, { outlineColor: 'red', zIndex: 9999999 }, 'DOM ROOT' );
                    // @if CK_DEBUG_DIALOG // }
                    if (domRootRect) {
                        this.moveTo(Math.round(domRootRect.left + domRootRect.width / 2 - dialogRect.width / 2), domRootRect.bottom - dialogRect.height - defaultOffset);
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
            case DialogViewPosition.EDITOR_ABOVE_CENTER:
                {
                    // @if CK_DEBUG_DIALOG // if ( domRootRect ) {
                    // @if CK_DEBUG_DIALOG // 	RectDrawer.draw( domRootRect, { outlineColor: 'red', zIndex: 9999999 }, 'DOM ROOT' );
                    // @if CK_DEBUG_DIALOG // }
                    if (domRootRect) {
                        this.moveTo(Math.round(domRootRect.left + domRootRect.width / 2 - dialogRect.width / 2), domRootRect.top - dialogRect.height - defaultOffset);
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
            case DialogViewPosition.EDITOR_BELOW_CENTER:
                {
                    // @if CK_DEBUG_DIALOG // if ( domRootRect ) {
                    // @if CK_DEBUG_DIALOG // 	RectDrawer.draw( domRootRect, { outlineColor: 'red', zIndex: 9999999 }, 'DOM ROOT' );
                    // @if CK_DEBUG_DIALOG // }
                    if (domRootRect) {
                        this.moveTo(Math.round(domRootRect.left + domRootRect.width / 2 - dialogRect.width / 2), domRootRect.bottom + defaultOffset);
                    } else {
                        this._moveOffScreen();
                    }
                    break;
                }
        }
    }
    /**
	 * Calculates the visible DOM root part.
	 */ _getVisibleDomRootRect(viewportRect) {
        let visibleDomRootRect = new Rect(this._getCurrentDomRoot()).getVisible();
        if (!visibleDomRootRect) {
            return null;
        } else {
            visibleDomRootRect = viewportRect.getIntersection(visibleDomRootRect);
            if (!visibleDomRootRect) {
                return null;
            }
        }
        return visibleDomRootRect;
    }
    /**
	 * Calculates the dialog element rect.
	 */ _getDialogRect() {
        return new Rect(this.element.firstElementChild);
    }
    /**
	 * Calculates the viewport rect.
	 */ _getViewportRect() {
        return getConstrainedViewportRect(this._getViewportOffset());
    }
    /**
	 * Collects all focusable elements inside the dialog parts
	 * and adds them to the focus tracker and focus cycler.
	 */ _updateFocusCyclableItems() {
        const focusables = [];
        if (this.contentView) {
            for (const child of this.contentView.children){
                if (isFocusable(child)) {
                    focusables.push(child);
                }
            }
        }
        if (this.actionsView) {
            focusables.push(this.actionsView);
        }
        if (this.closeButtonView) {
            focusables.push(this.closeButtonView);
        }
        focusables.forEach((focusable)=>{
            this._focusables.add(focusable);
            this.focusTracker.add(focusable.element);
            if (isViewWithFocusCycler(focusable)) {
                this.listenTo(focusable.focusCycler, 'forwardCycle', (evt)=>{
                    this._focusCycler.focusNext();
                    // Stop the event propagation only if there are more focusables.
                    if (this._focusCycler.next !== this._focusCycler.focusables.get(this._focusCycler.current)) {
                        evt.stop();
                    }
                });
                this.listenTo(focusable.focusCycler, 'backwardCycle', (evt)=>{
                    this._focusCycler.focusPrevious();
                    // Stop the event propagation only if there are more focusables.
                    if (this._focusCycler.previous !== this._focusCycler.focusables.get(this._focusCycler.current)) {
                        evt.stop();
                    }
                });
            }
        });
    }
    /**
	 * Creates the close button view that is displayed in the header view corner.
	 */ _createCloseButton() {
        const buttonView = new ButtonView(this.locale);
        const t = this.locale.t;
        buttonView.set({
            label: t('Close'),
            tooltip: true,
            icon: icons.cancel
        });
        buttonView.on('execute', ()=>this.fire('close', {
                source: 'closeButton'
            }));
        return buttonView;
    }
}
// Returns a viewport `Rect` shrunk by the viewport offset config from all sides.
// TODO: This is a duplicate from position.ts module. It should either be exported there or land somewhere in utils.
function getConstrainedViewportRect(viewportOffset) {
    viewportOffset = Object.assign({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    }, viewportOffset);
    const viewportRect = new Rect(global.window);
    viewportRect.top += viewportOffset.top;
    viewportRect.height -= viewportOffset.top;
    viewportRect.bottom -= viewportOffset.bottom;
    viewportRect.height -= viewportOffset.bottom;
    viewportRect.left += viewportOffset.left;
    viewportRect.right -= viewportOffset.right;
    viewportRect.width -= viewportOffset.left + viewportOffset.right;
    return viewportRect;
}

/**
 * The dialog controller class. It is used to show and hide the {@link module:ui/dialog/dialogview~DialogView}.
 */ class Dialog extends Plugin {
    /**
	 * The currently visible dialog view instance.
	 */ view;
    /**
	 * The `Dialog` plugin instance which most recently showed the dialog.
	 *
	 * Only one dialog can be visible at once, even if there are many editor instances on the page.
	 * If an editor wants to show a dialog, it should first hide the dialog that is already opened.
	 * But only the `Dialog` instance that showed the dialog is able able to properly hide it.
	 * This is why we need to store it in a globally available space (static property).
	 * This way every `Dialog` plugin in every editor is able to correctly close any open dialog window.
	 */ static _visibleDialogPlugin;
    /**
	 * A configurable callback called when the dialog is hidden.
	 */ _onHide;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Dialog';
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        const t = editor.t;
        this._initShowHideListeners();
        this._initFocusToggler();
        this._initMultiRootIntegration();
        this.set('id', null);
        // Add the information about the keystroke to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            categoryId: 'navigation',
            keystrokes: [
                {
                    label: t('Move focus in and out of an active dialog window'),
                    keystroke: 'Ctrl+F6',
                    mayRequireFn: true
                }
            ]
        });
    }
    /**
	 * Initiates listeners for the `show` and `hide` events emitted by this plugin.
	 *
	 * We could not simply decorate the {@link #show} and {@link #hide} methods to fire events,
	 * because they would be fired in the wrong order &ndash; first would be `show` and then `hide`
	 * (because showing the dialog actually starts with hiding the previously visible one).
	 * Hence, we added private methods {@link #_show} and {@link #_hide} which are called on events
	 * in the desired sequence.
	 */ _initShowHideListeners() {
        this.on('show', (evt, args)=>{
            this._show(args);
        });
        // 'low' priority allows to add custom callback between `_show()` and `onShow()`.
        this.on('show', (evt, args)=>{
            if (args.onShow) {
                args.onShow(this);
            }
        }, {
            priority: 'low'
        });
        this.on('hide', ()=>{
            if (Dialog._visibleDialogPlugin) {
                Dialog._visibleDialogPlugin._hide();
            }
        });
        // 'low' priority allows to add custom callback between `_hide()` and `onHide()`.
        this.on('hide', ()=>{
            if (this._onHide) {
                this._onHide(this);
                this._onHide = undefined;
            }
        }, {
            priority: 'low'
        });
    }
    /**
	 * Initiates keystroke handler for toggling the focus between the editor and the dialog view.
	 */ _initFocusToggler() {
        const editor = this.editor;
        editor.keystrokes.set('Ctrl+F6', (data, cancel)=>{
            if (!this.isOpen || this.view.isModal) {
                return;
            }
            if (this.view.focusTracker.isFocused) {
                editor.editing.view.focus();
            } else {
                this.view.focus();
            }
            cancel();
        });
    }
    /**
	 * Provides an integration between the root attaching and detaching and positioning of the view.
	 */ _initMultiRootIntegration() {
        const model = this.editor.model;
        model.document.on('change:data', ()=>{
            if (!this.view) {
                return;
            }
            const changedRoots = model.document.differ.getChangedRoots();
            for (const changes of changedRoots){
                if (changes.state) {
                    this.view.updatePosition();
                }
            }
        });
    }
    /**
	 * Displays a dialog window.
	 *
	 * This method requires a {@link ~DialogDefinition} that defines the dialog's content, title, icon, action buttons, etc.
	 *
	 * For example, the following definition will create a dialog with:
	 * * A header consisting of an icon, a title, and a "Close" button (it is added by default).
	 * * A content consisting of a view with a single paragraph.
	 * * A footer consisting of two buttons: "Yes" and "No".
	 *
	 * ```js
	 * // Create the view that will be used as the dialog's content.
	 * const textView = new View( locale );
	 *
	 * textView.setTemplate( {
	 * 	tag: 'div',
	 * 	attributes: {
	 * 		style: {
	 * 			padding: 'var(--ck-spacing-large)',
	 * 			whiteSpace: 'initial',
	 * 			width: '100%',
	 * 			maxWidth: '500px'
	 * 		},
	 * 		tabindex: -1
	 * 	},
	 * 	children: [
	 * 		'Lorem ipsum dolor sit amet...'
	 * 	]
	 * } );
	 *
	 * // Show the dialog.
	 * editor.plugins.get( 'Dialog' ).show( {
	 *	id: 'myDialog',
	 * 	icon: 'myIcon', // This should be an SVG string.
	 * 	title: 'My dialog',
	 * 	content: textView,
	 * 	actionButtons: [
	 *		{
	 *			label: t( 'Yes' ),
	 *			class: 'ck-button-action',
	 *			withText: true,
	 *			onExecute: () => dialog.hide()
	 *		},
	 *		{
	 *			label: t( 'No' ),
	 *			withText: true,
	 *			onExecute: () => dialog.hide()
	 *		}
	 *	]
	 * } );
	 * ```
	 *
	 * By specifying the {@link ~DialogDefinition#onShow} and {@link ~DialogDefinition#onHide} callbacks
	 * it is also possible to add callbacks that will be called when the dialog is shown or hidden.
	 *
	 * For example, the callbacks in the following definition:
	 * * Disable the default behavior of the <kbd>Esc</kbd> key.
	 * * Fire a custom event when the dialog gets hidden.
	 *
	 * ```js
	 * editor.plugins.get( 'Dialog' ).show( {
	 * 	// ...
	 * 	onShow: dialog => {
	 * 		dialog.view.on( 'close', ( evt, data ) => {
	 * 			// Only prevent the event from the "Esc" key - do not affect the other ways of closing the dialog.
	 * 			if ( data.source === 'escKeyPress' ) {
	 * 				evt.stop();
	 * 			}
	 * 		} );
	 * 	},
	 * 	onHide: dialog => {
	 * 		dialog.fire( 'dialogDestroyed' );
	 * 	}
	 * } );
	 * ```
	 *
	 * Internally, calling this method:
	 * 1. Hides the currently visible dialog (if any) calling the {@link #hide} method
	 * (fires the {@link ~DialogHideEvent hide event}).
	 * 2. Fires the {@link ~DialogShowEvent show event} which allows for adding callbacks that customize the
	 * behavior of the dialog.
	 * 3. Shows the dialog.
	 */ show(dialogDefinition) {
        this.hide();
        this.fire(`show:${dialogDefinition.id}`, dialogDefinition);
    }
    /**
	 * Handles creating the {@link module:ui/dialog/dialogview~DialogView} instance and making it visible.
	 */ _show({ id, icon, title, hasCloseButton = true, content, actionButtons, className, isModal, position, onHide }) {
        const editor = this.editor;
        this.view = new DialogView(editor.locale, {
            getCurrentDomRoot: ()=>{
                return editor.editing.view.getDomRoot(editor.model.document.selection.anchor.root.rootName);
            },
            getViewportOffset: ()=>{
                return editor.ui.viewportOffset;
            }
        });
        const view = this.view;
        view.on('close', ()=>{
            this.hide();
        });
        editor.ui.view.body.add(view);
        editor.ui.focusTracker.add(view.element);
        editor.keystrokes.listenTo(view.element);
        // Unless the user specified a position, modals should always be centered on the screen.
        // Otherwise, let's keep dialogs centered in the editing root by default.
        if (!position) {
            position = isModal ? DialogViewPosition.SCREEN_CENTER : DialogViewPosition.EDITOR_CENTER;
        }
        view.set({
            position,
            _isVisible: true,
            className,
            isModal
        });
        view.setupParts({
            icon,
            title,
            hasCloseButton,
            content,
            actionButtons
        });
        this.id = id;
        if (onHide) {
            this._onHide = onHide;
        }
        this.isOpen = true;
        Dialog._visibleDialogPlugin = this;
    }
    /**
	 * Hides the dialog. This method is decorated to enable interacting on the {@link ~DialogHideEvent hide event}.
	 *
	 * See {@link #show}.
	 */ hide() {
        if (Dialog._visibleDialogPlugin) {
            Dialog._visibleDialogPlugin.fire(`hide:${Dialog._visibleDialogPlugin.id}`);
        }
    }
    /**
	 * Destroys the {@link module:ui/dialog/dialogview~DialogView} and cleans up the stored dialog state.
	 */ _hide() {
        if (!this.view) {
            return;
        }
        const editor = this.editor;
        const view = this.view;
        // Reset the content view to prevent its children from being destroyed in the standard
        // View#destroy() (and collections) chain. If the content children were left in there,
        // they would have to be re-created by the feature using the dialog every time the dialog
        // shows up.
        if (view.contentView) {
            view.contentView.reset();
        }
        editor.ui.view.body.remove(view);
        editor.ui.focusTracker.remove(view.element);
        editor.keystrokes.stopListening(view.element);
        view.destroy();
        editor.editing.view.focus();
        this.id = null;
        this.isOpen = false;
        Dialog._visibleDialogPlugin = null;
    }
}

/**
 * A menu bar list button view. Buttons like this one execute user actions.
 */ class MenuBarMenuListItemButtonView extends ButtonView {
    /**
	 * Creates an instance of the menu bar list button view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        this.set({
            withText: true,
            withKeystroke: true,
            tooltip: false,
            role: 'menuitem'
        });
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-menu-bar__menu__item__button'
                ]
            }
        });
    }
}

/**
 * The label view class.
 */ class LabelView extends View {
    /**
	 * An unique id of the label. It can be used by other UI components to reference
	 * the label, for instance, using the `aria-describedby` DOM attribute.
	 */ id;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.set('text', undefined);
        this.set('for', undefined);
        this.id = `ck-editor__label_${uid()}`;
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'label',
            attributes: {
                class: [
                    'ck',
                    'ck-label'
                ],
                id: this.id,
                for: bind.to('for')
            },
            children: [
                {
                    text: bind.to('text')
                }
            ]
        });
    }
}

/**
 * The view displaying keystrokes in the Accessibility help dialog.
 */ class AccessibilityHelpContentView extends View {
    /**
	 * @inheritDoc
	 */ constructor(locale, keystrokes){
        super(locale);
        const t = locale.t;
        const helpLabel = new LabelView();
        helpLabel.text = t('Help Contents. To close this dialog press ESC.');
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-accessibility-help-dialog__content'
                ],
                'aria-labelledby': helpLabel.id,
                role: 'document',
                tabindex: -1
            },
            children: [
                createElement(document, 'p', {}, t('Below, you can find a list of keyboard shortcuts that can be used in the editor.')),
                ...this._createCategories(Array.from(keystrokes.values())),
                helpLabel
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ focus() {
        this.element.focus();
    }
    /**
	 * Creates `<section><h3>Category label</h3>...</section>` elements for each category of keystrokes.
	 */ _createCategories(categories) {
        return categories.map((categoryDefinition)=>{
            const elements = [
                // Category header.
                createElement(document, 'h3', {}, categoryDefinition.label),
                // Category definitions (<dl>) and their optional headers (<h4>).
                ...Array.from(categoryDefinition.groups.values()).map((groupDefinition)=>this._createGroup(groupDefinition)).flat()
            ];
            // Category description (<p>).
            if (categoryDefinition.description) {
                elements.splice(1, 0, createElement(document, 'p', {}, categoryDefinition.description));
            }
            return createElement(document, 'section', {}, elements);
        });
    }
    /**
	 * Creates `[<h4>Optional label</h4>]<dl>...</dl>` elements for each group of keystrokes in a category.
	 */ _createGroup(groupDefinition) {
        const definitionAndDescriptionElements = groupDefinition.keystrokes.sort((a, b)=>a.label.localeCompare(b.label)).map((keystrokeDefinition)=>this._createGroupRow(keystrokeDefinition)).flat();
        const elements = [
            createElement(document, 'dl', {}, definitionAndDescriptionElements)
        ];
        if (groupDefinition.label) {
            elements.unshift(createElement(document, 'h4', {}, groupDefinition.label));
        }
        return elements;
    }
    /**
	 * Creates `<dt>Keystroke label</dt><dd>Keystroke definition</dd>` elements for each keystroke in a group.
	 */ _createGroupRow(keystrokeDefinition) {
        const t = this.locale.t;
        const dt = createElement(document, 'dt');
        const dd = createElement(document, 'dd');
        const normalizedKeystrokeDefinition = normalizeKeystrokeDefinition(keystrokeDefinition.keystroke);
        const keystrokeAlternativeHTMLs = [];
        for (const keystrokeAlternative of normalizedKeystrokeDefinition){
            keystrokeAlternativeHTMLs.push(keystrokeAlternative.map(keystrokeToEnvKbd).join(''));
        }
        dt.innerHTML = keystrokeDefinition.label;
        dd.innerHTML = keystrokeAlternativeHTMLs.join(', ') + (keystrokeDefinition.mayRequireFn && env.isMac ? ` ${t('(may require <kbd>Fn</kbd>)')}` : '');
        return [
            dt,
            dd
        ];
    }
}
function keystrokeToEnvKbd(keystroke) {
    return getEnvKeystrokeText(keystroke).split('+').map((part)=>`<kbd>${part}</kbd>`).join('+');
}
function normalizeKeystrokeDefinition(definition) {
    if (typeof definition === 'string') {
        return [
            [
                definition
            ]
        ];
    }
    if (typeof definition[0] === 'string') {
        return [
            definition
        ];
    }
    return definition;
}

var accessibilityIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 6.628a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z\"/><path d=\"M8.5 9.125a.3.3 0 0 0-.253-.296L5.11 8.327a.75.75 0 1 1 .388-1.449l4.04.716c.267.072.624.08.893.009l4.066-.724a.75.75 0 1 1 .388 1.45l-3.132.5a.3.3 0 0 0-.253.296v1.357a.3.3 0 0 0 .018.102l1.615 4.438a.75.75 0 0 1-1.41.513l-1.35-3.71a.3.3 0 0 0-.281-.197h-.209a.3.3 0 0 0-.282.198l-1.35 3.711a.75.75 0 0 1-1.41-.513l1.64-4.509a.3.3 0 0 0 .019-.103V9.125Z\"/><path clip-rule=\"evenodd\" d=\"M10 18.5a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17Zm0 1.5c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10Z\"/></svg>";

/**
 * A plugin that brings the accessibility help dialog to the editor available under the <kbd>Alt</kbd>+<kbd>0</kbd>
 * keystroke and via the "Accessibility help" toolbar button. The dialog displays a list of keystrokes that can be used
 * by the user to perform various actions in the editor.
 *
 * Keystroke information is loaded from {@link module:core/accessibility~Accessibility#keystrokeInfos}. New entries can be
 * added using the API provided by the {@link module:core/accessibility~Accessibility} class.
 */ class AccessibilityHelp extends Plugin {
    /**
	 * The view that displays the dialog content (list of keystrokes).
	 * Created when the dialog is opened for the first time.
	 */ contentView = null;
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            Dialog
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'AccessibilityHelp';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.locale.t;
        editor.ui.componentFactory.add('accessibilityHelp', ()=>{
            const button = this._createButton(ButtonView);
            button.set({
                tooltip: true,
                withText: false,
                label: t('Accessibility help')
            });
            return button;
        });
        editor.ui.componentFactory.add('menuBar:accessibilityHelp', ()=>{
            const button = this._createButton(MenuBarMenuListItemButtonView);
            button.label = t('Accessibility');
            return button;
        });
        editor.keystrokes.set('Alt+0', (evt, cancel)=>{
            this._showDialog();
            cancel();
        });
        this._setupRootLabels();
    }
    /**
	 * Creates a button to show accessibility help dialog, for use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const view = new ButtonClass(locale);
        view.set({
            keystroke: 'Alt+0',
            icon: accessibilityIcon
        });
        view.on('execute', ()=>this._showDialog());
        return view;
    }
    /**
	 * Injects a help text into each editing root's `aria-label` attribute allowing assistive technology users
	 * to discover the availability of the Accessibility help dialog.
	 */ _setupRootLabels() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        const t = editor.t;
        editor.ui.on('ready', ()=>{
            editingView.change((writer)=>{
                for (const root of editingView.document.roots){
                    addAriaLabelTextToRoot(writer, root);
                }
            });
            editor.on('addRoot', (evt, modelRoot)=>{
                const viewRoot = editor.editing.view.document.getRoot(modelRoot.rootName);
                editingView.change((writer)=>addAriaLabelTextToRoot(writer, viewRoot));
            }, {
                priority: 'low'
            });
        });
        function addAriaLabelTextToRoot(writer, viewRoot) {
            const currentAriaLabel = viewRoot.getAttribute('aria-label');
            const newAriaLabel = `${currentAriaLabel}. ${t('Press %0 for help.', [
                getEnvKeystrokeText('Alt+0')
            ])}`;
            writer.setAttribute('aria-label', newAriaLabel, viewRoot);
        }
    }
    /**
	 * Shows the accessibility help dialog. Also, creates {@link #contentView} on demand.
	 */ _showDialog() {
        const editor = this.editor;
        const dialog = editor.plugins.get('Dialog');
        const t = editor.locale.t;
        if (!this.contentView) {
            this.contentView = new AccessibilityHelpContentView(editor.locale, editor.accessibility.keystrokeInfos);
        }
        dialog.show({
            id: 'accessibilityHelp',
            className: 'ck-accessibility-help-dialog',
            title: t('Accessibility help'),
            icon: accessibilityIcon,
            hasCloseButton: true,
            content: this.contentView
        });
    }
}

/**
 * This is a special {@link module:ui/viewcollection~ViewCollection} dedicated to elements that are detached
 * from the DOM structure of the editor, like panels, icons, etc.
 *
 * The body collection is available in the {@link module:ui/editorui/editoruiview~EditorUIView#body `editor.ui.view.body`} property.
 * Any plugin can add a {@link module:ui/view~View view} to this collection.
 * These views will render in a container placed directly in the `<body>` element.
 * The editor will detach and destroy this collection when the editor will be {@link module:core/editor/editor~Editor#destroy destroyed}.
 *
 * If you need to control the life cycle of the body collection on your own, you can create your own instance of this class.
 *
 * A body collection will render itself automatically in the DOM body element as soon as you call {@link ~BodyCollection#attachToDom}.
 * If you create multiple body collections, this class will create a special wrapper element in the DOM to limit the number of
 * elements created directly in the body and remove it when the last body collection will be
 * {@link ~BodyCollection#detachFromDom detached}.
 */ class BodyCollection extends ViewCollection {
    /**
	 * The {@link module:core/editor/editor~Editor#locale editor's locale} instance.
	 * See the view {@link module:ui/view~View#locale locale} property.
	 */ locale;
    /**
	 * The element holding elements of the body region.
	 */ _bodyCollectionContainer;
    /**
	 * Creates a new instance of the {@link module:ui/editorui/bodycollection~BodyCollection}.
	 *
	 * @param locale The {@link module:core/editor/editor~Editor editor's locale} instance.
	 * @param initialItems The initial items of the collection.
	 */ constructor(locale, initialItems = []){
        super(initialItems);
        this.locale = locale;
    }
    /**
	 * The element holding elements of the body region.
	 */ get bodyCollectionContainer() {
        return this._bodyCollectionContainer;
    }
    /**
	 * Attaches the body collection to the DOM body element. You need to execute this method to render the content of
	 * the body collection.
	 */ attachToDom() {
        this._bodyCollectionContainer = new Template({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-reset_all',
                    'ck-body',
                    'ck-rounded-corners'
                ],
                dir: this.locale.uiLanguageDirection
            },
            children: this
        }).render();
        let wrapper = document.querySelector('.ck-body-wrapper');
        if (!wrapper) {
            wrapper = createElement(document, 'div', {
                class: 'ck-body-wrapper'
            });
            document.body.appendChild(wrapper);
        }
        wrapper.appendChild(this._bodyCollectionContainer);
    }
    /**
	 * Detaches the collection from the DOM structure. Use this method when you do not need to use the body collection
	 * anymore to clean-up the DOM structure.
	 */ detachFromDom() {
        super.destroy();
        if (this._bodyCollectionContainer) {
            this._bodyCollectionContainer.remove();
        }
        const wrapper = document.querySelector('.ck-body-wrapper');
        if (wrapper && wrapper.childElementCount == 0) {
            wrapper.remove();
        }
    }
}

/**
 * The switch button view class.
 *
 * ```ts
 * const view = new SwitchButtonView();
 *
 * view.set( {
 * 	withText: true,
 * 	label: 'Switch me!'
 * } );
 *
 * view.render();
 *
 * document.body.append( view.element );
 * ```
 */ class SwitchButtonView extends ButtonView {
    /**
	 * The toggle switch of the button.
	 */ toggleSwitchView;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.isToggleable = true;
        this.toggleSwitchView = this._createToggleView();
        this.extendTemplate({
            attributes: {
                class: 'ck-switchbutton'
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.add(this.toggleSwitchView);
    }
    /**
	 * Creates a toggle child view.
	 */ _createToggleView() {
        const toggleSwitchView = new View();
        toggleSwitchView.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-button__toggle'
                ]
            },
            children: [
                {
                    tag: 'span',
                    attributes: {
                        class: [
                            'ck',
                            'ck-button__toggle__inner'
                        ]
                    }
                }
            ]
        });
        return toggleSwitchView;
    }
}

/**
 * The file dialog button view.
 *
 * This component provides a button that opens the native file selection dialog.
 * It can be used to implement the UI of a file upload feature.
 *
 * ```ts
 * const view = new FileDialogButtonView( locale );
 *
 * view.set( {
 * 	acceptedType: 'image/*',
 * 	allowMultipleFiles: true
 * 	label: t( 'Insert image' ),
 * 	icon: imageIcon,
 * 	tooltip: true
 * } );
 *
 * view.on( 'done', ( evt, files ) => {
 * 	for ( const file of Array.from( files ) ) {
 * 		console.log( 'Selected file', file );
 * 	}
 * } );
 * ```
 */ class FileDialogButtonView extends ButtonView {
    /**
	 * The button view of the component.
	 *
	 * @deprecated
	 */ buttonView;
    /**
	 * A hidden `<input>` view used to execute file dialog.
	 */ _fileInputView;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        // For backward compatibility.
        this.buttonView = this;
        this._fileInputView = new FileInputView(locale);
        this._fileInputView.bind('acceptedType').to(this);
        this._fileInputView.bind('allowMultipleFiles').to(this);
        this._fileInputView.delegate('done').to(this);
        this.on('execute', ()=>{
            this._fileInputView.open();
        });
        this.extendTemplate({
            attributes: {
                class: 'ck-file-dialog-button'
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.add(this._fileInputView);
    }
}
/**
 * The hidden file input view class.
 */ class FileInputView extends View {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.set('acceptedType', undefined);
        this.set('allowMultipleFiles', false);
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'input',
            attributes: {
                class: [
                    'ck-hidden'
                ],
                type: 'file',
                tabindex: '-1',
                accept: bind.to('acceptedType'),
                multiple: bind.to('allowMultipleFiles')
            },
            on: {
                // Removing from code coverage since we cannot programmatically set input element files.
                change: bind.to(/* istanbul ignore next -- @preserve */ ()=>{
                    if (this.element && this.element.files && this.element.files.length) {
                        this.fire('done', this.element.files);
                    }
                    this.element.value = '';
                })
            }
        });
    }
    /**
	 * Opens file dialog.
	 */ open() {
        this.element.click();
    }
}

var dropdownArrowIcon = "<svg viewBox=\"0 0 10 10\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M.941 4.523a.75.75 0 1 1 1.06-1.06l3.006 3.005 3.005-3.005a.75.75 0 1 1 1.06 1.06l-3.549 3.55a.75.75 0 0 1-1.168-.136L.941 4.523z\"/></svg>";

/**
 * A collapsible UI component. Consists of a labeled button and a container which can be collapsed
 * by clicking the button. The collapsible container can be a host to other UI views.
 *
 * @internal
 */ class CollapsibleView extends View {
    /**
	 * The main button that, when clicked, collapses or expands the container with {@link #children}.
	 */ buttonView;
    /**
	 * A collection of the child views that can be collapsed by clicking the {@link #buttonView}.
	 */ children;
    /**
	 * Creates an instance of the collapsible view.
	 *
	 * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
	 * @param childViews An optional array of initial child views to be inserted into the collapsible.
	 */ constructor(locale, childViews){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isCollapsed', false);
        this.set('label', '');
        this.buttonView = this._createButtonView();
        this.children = this.createCollection();
        this.set('_collapsibleAriaLabelUid', undefined);
        if (childViews) {
            this.children.addMany(childViews);
        }
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-collapsible',
                    bind.if('isCollapsed', 'ck-collapsible_collapsed')
                ]
            },
            children: [
                this.buttonView,
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-collapsible__children'
                        ],
                        role: 'region',
                        hidden: bind.if('isCollapsed', 'hidden'),
                        'aria-labelledby': bind.to('_collapsibleAriaLabelUid')
                    },
                    children: this.children
                }
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this._collapsibleAriaLabelUid = this.buttonView.labelView.element.id;
    }
    /**
	 * Focuses the first focusable.
	 */ focus() {
        this.buttonView.focus();
    }
    /**
	 * Creates the main {@link #buttonView} of the collapsible.
	 */ _createButtonView() {
        const buttonView = new ButtonView(this.locale);
        const bind = buttonView.bindTemplate;
        buttonView.set({
            withText: true,
            icon: dropdownArrowIcon
        });
        buttonView.extendTemplate({
            attributes: {
                'aria-expanded': bind.to('isOn', (value)=>String(value))
            }
        });
        buttonView.bind('label').to(this);
        buttonView.bind('isOn').to(this, 'isCollapsed', (isCollapsed)=>!isCollapsed);
        buttonView.on('execute', ()=>{
            this.isCollapsed = !this.isCollapsed;
        });
        return buttonView;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/colorgrid/utils
 */ /**
 * Returns color configuration options as defined in `editor.config.(fontColor|fontBackgroundColor).colors` or
 * `editor.config.table.(tableProperties|tableCellProperties).(background|border).colors
 * but processed to account for editor localization in the correct language.
 *
 * Note: The reason behind this method is that there is no way to use {@link module:utils/locale~Locale#t}
 * when the user configuration is defined because the editor does not exist yet.
 *
 * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
 */ function getLocalizedColorOptions(locale, options) {
    const t = locale.t;
    const localizedColorNames = {
        Black: t('Black'),
        'Dim grey': t('Dim grey'),
        Grey: t('Grey'),
        'Light grey': t('Light grey'),
        White: t('White'),
        Red: t('Red'),
        Orange: t('Orange'),
        Yellow: t('Yellow'),
        'Light green': t('Light green'),
        Green: t('Green'),
        Aquamarine: t('Aquamarine'),
        Turquoise: t('Turquoise'),
        'Light blue': t('Light blue'),
        Blue: t('Blue'),
        Purple: t('Purple')
    };
    return options.map((colorOption)=>{
        const label = localizedColorNames[colorOption.label];
        if (label && label != colorOption.label) {
            colorOption.label = label;
        }
        return colorOption;
    });
}
/**
 * Creates a unified color definition object from color configuration options.
 * The object contains the information necessary to both render the UI and initialize the conversion.
 */ function normalizeColorOptions(options) {
    return options.map(normalizeSingleColorDefinition).filter((option)=>!!option);
}
/**
 * Creates a normalized color definition from the user-defined configuration.
 * The "normalization" means it will create full
 * {@link module:ui/colorgrid/colorgridview~ColorDefinition `ColorDefinition-like`}
 * object for string values, and add a `view` property, for each definition.
 */ function normalizeSingleColorDefinition(color) {
    if (typeof color === 'string') {
        return {
            model: color,
            label: color,
            hasBorder: false,
            view: {
                name: 'span',
                styles: {
                    color
                }
            }
        };
    } else {
        return {
            model: color.color,
            label: color.label || color.color,
            hasBorder: color.hasBorder === undefined ? false : color.hasBorder,
            view: {
                name: 'span',
                styles: {
                    color: `${color.color}`
                }
            }
        };
    }
}

var checkIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path class=\"ck-icon__fill\" d=\"M16.935 5.328a2 2 0 0 1 0 2.829l-7.778 7.778a2 2 0 0 1-2.829 0L3.5 13.107a1.999 1.999 0 1 1 2.828-2.829l.707.707a1 1 0 0 0 1.414 0l5.658-5.657a2 2 0 0 1 2.828 0z\"/><path d=\"M14.814 6.035 8.448 12.4a1 1 0 0 1-1.414 0l-1.413-1.415A1 1 0 1 0 4.207 12.4l2.829 2.829a1 1 0 0 0 1.414 0l7.778-7.778a1 1 0 1 0-1.414-1.415z\"/></svg>";

/**
 * This class represents a single color tile in the {@link module:ui/colorgrid/colorgridview~ColorGridView}.
 */ class ColorTileView extends ButtonView {
    constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('color', undefined);
        this.set('hasBorder', false);
        this.icon = checkIcon;
        this.extendTemplate({
            attributes: {
                style: {
                    // https://github.com/ckeditor/ckeditor5/issues/14907
                    backgroundColor: bind.to('color', (color)=>env.isMediaForcedColors ? null : color)
                },
                class: [
                    'ck',
                    'ck-color-grid__tile',
                    bind.if('hasBorder', 'ck-color-selector__color-tile_bordered')
                ]
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.iconView.fillColor = 'hsl(0, 0%, 100%)';
    }
}

/**
 * A grid of {@link module:ui/colorgrid/colortileview~ColorTileView color tiles}.
 */ class ColorGridView extends View {
    /**
	 * A number of columns for the tiles grid.
	 */ columns;
    /**
	 * Collection of the child tile views.
	 */ items;
    /**
	 * Tracks information about DOM focus in the grid.
	 */ focusTracker;
    /**
	 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes;
    /**
	 * Creates an instance of a color grid containing {@link module:ui/colorgrid/colortileview~ColorTileView tiles}.
	 *
	 * @fires execute
	 * @param locale The localization services instance.
	 * @param options Component configuration
	 * @param options.colorDefinitions Array with definitions
	 * required to create the {@link module:ui/colorgrid/colortileview~ColorTileView tiles}.
	 * @param options.columns A number of columns to display the tiles.
	 */ constructor(locale, options){
        super(locale);
        const colorDefinitions = options && options.colorDefinitions ? options.colorDefinitions : [];
        this.columns = options && options.columns ? options.columns : 5;
        const viewStyleAttribute = {
            gridTemplateColumns: `repeat( ${this.columns}, 1fr)`
        };
        this.set('selectedColor', undefined);
        this.items = this.createCollection();
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this.items.on('add', (evt, colorTile)=>{
            colorTile.isOn = colorTile.color === this.selectedColor;
        });
        colorDefinitions.forEach((color)=>{
            const colorTile = new ColorTileView();
            colorTile.set({
                color: color.color,
                label: color.label,
                tooltip: true,
                hasBorder: color.options.hasBorder
            });
            colorTile.on('execute', ()=>{
                this.fire('execute', {
                    value: color.color,
                    hasBorder: color.options.hasBorder,
                    label: color.label
                });
            });
            this.items.add(colorTile);
        });
        this.setTemplate({
            tag: 'div',
            children: this.items,
            attributes: {
                class: [
                    'ck',
                    'ck-color-grid'
                ],
                style: viewStyleAttribute
            }
        });
        this.on('change:selectedColor', (evt, name, selectedColor)=>{
            for (const item of this.items){
                item.isOn = item.color === selectedColor;
            }
        });
    }
    /**
	 * Focuses the first focusable in {@link #items}.
	 */ focus() {
        if (this.items.length) {
            this.items.first.focus();
        }
    }
    /**
	 * Focuses the last focusable in {@link #items}.
	 */ focusLast() {
        if (this.items.length) {
            this.items.last.focus();
        }
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        // Items added before rendering should be known to the #focusTracker.
        for (const item of this.items){
            this.focusTracker.add(item.element);
        }
        this.items.on('add', (evt, item)=>{
            this.focusTracker.add(item.element);
        });
        this.items.on('remove', (evt, item)=>{
            this.focusTracker.remove(item.element);
        });
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
        addKeyboardHandlingForGrid({
            keystrokeHandler: this.keystrokes,
            focusTracker: this.focusTracker,
            gridItems: this.items,
            numberOfColumns: this.columns,
            uiLanguageDirection: this.locale && this.locale.uiLanguageDirection
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/colorpicker/utils
 */ /* eslint-disable @typescript-eslint/ban-ts-comment */ // There are no available types for 'color-parse' module.
// @ts-ignore
/**
 * Parses and converts the color string to requested format. Handles variety of color spaces
 * like `hsl`, `hex` or `rgb`.
 *
 * @param color
 * @returns A color string.
 */ function convertColor(color, outputFormat) {
    if (!color) {
        return '';
    }
    const colorObject = parseColorString(color);
    if (!colorObject) {
        return '';
    }
    if (colorObject.space === outputFormat) {
        return color;
    }
    if (!canConvertParsedColor(colorObject)) {
        return '';
    }
    const fromColorSpace = convert[colorObject.space];
    const toColorSpace = fromColorSpace[outputFormat];
    if (!toColorSpace) {
        return '';
    }
    const convertedColorChannels = toColorSpace(colorObject.space === 'hex' ? colorObject.hexValue : colorObject.values);
    return formatColorOutput(convertedColorChannels, outputFormat);
}
/**
 * Converts a color string to hex format.
 *
 * @param color
 * @returns A color string.
 */ function convertToHex(color) {
    if (!color) {
        return '';
    }
    const colorObject = parseColorString(color);
    if (!colorObject) {
        return '#000';
    }
    if (colorObject.space === 'hex') {
        return colorObject.hexValue;
    }
    return convertColor(color, 'hex');
}
/**
 * Registers the custom element in the
 * [CustomElementsRegistry](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry).
 */ function registerCustomElement(elementName, constructor) {
    if (customElements.get(elementName) === undefined) {
        customElements.define(elementName, constructor);
    }
}
/**
 * Formats the passed color channels according to the requested format.
 *
 * @param values
 * @param format
 * @returns A color string.
 */ function formatColorOutput(values, format) {
    switch(format){
        case 'hex':
            return `#${values}`;
        case 'rgb':
            return `rgb( ${values[0]}, ${values[1]}, ${values[2]} )`;
        case 'hsl':
            return `hsl( ${values[0]}, ${values[1]}%, ${values[2]}% )`;
        case 'hwb':
            return `hwb( ${values[0]}, ${values[1]}, ${values[2]} )`;
        case 'lab':
            return `lab( ${values[0]}% ${values[1]} ${values[2]} )`;
        case 'lch':
            return `lch( ${values[0]}% ${values[1]} ${values[2]} )`;
        default:
            return '';
    }
}
function parseColorString(colorString) {
    // Parser library treats `hex` format as belonging to `rgb` space | which messes up further conversion.
    // Let's parse such strings on our own.
    if (colorString.startsWith('#')) {
        const parsedHex = parse(colorString);
        return {
            space: 'hex',
            values: parsedHex.values,
            hexValue: colorString,
            alpha: parsedHex.alpha
        };
    }
    const parsed = parse(colorString);
    if (!parsed.space) {
        return null;
    }
    return parsed;
}
function canConvertParsedColor(parsedColor) {
    return Object.keys(convert).includes(parsedColor.space);
}

/**
 * The labeled field view class. It can be used to enhance any view with the following features:
 *
 * * a label,
 * * (optional) an error message,
 * * (optional) an info (status) text,
 *
 * all bound logically by proper DOM attributes for UX and accessibility.  It also provides an interface
 * (e.g. observable properties) that allows controlling those additional features.
 *
 * The constructor of this class requires a callback that returns a view to be labeled. The callback
 * is called with unique ids that allow binding of DOM properties:
 *
 * ```ts
 * const labeledInputView = new LabeledFieldView( locale, ( labeledFieldView, viewUid, statusUid ) => {
 * 	const inputView = new InputTextView( labeledFieldView.locale );
 *
 * 	inputView.set( {
 * 		id: viewUid,
 * 		ariaDescribedById: statusUid
 * 	} );
 *
 * 	inputView.bind( 'isReadOnly' ).to( labeledFieldView, 'isEnabled', value => !value );
 * 	inputView.bind( 'hasError' ).to( labeledFieldView, 'errorText', value => !!value );
 *
 * 	return inputView;
 * } );
 *
 * labeledInputView.label = 'User name';
 * labeledInputView.infoText = 'Full name like for instance, John Doe.';
 * labeledInputView.render();
 *
 * document.body.append( labeledInputView.element );
 * ```
 *
 * See {@link module:ui/labeledfield/utils} to discover ready–to–use labeled input helpers for common
 * UI components.
 */ class LabeledFieldView extends View {
    /**
	 * The field view that gets labeled.
	 */ fieldView;
    /**
	 * The label view instance that describes the entire view.
	 */ labelView;
    /**
	 * The status view for the {@link #fieldView}. It displays {@link #errorText} and
	 * {@link #infoText}.
	 */ statusView;
    /**
	 * A collection of children of the internal wrapper element. Allows inserting additional DOM elements (views) next to
	 * the {@link #fieldView} for easy styling (e.g. positioning).
	 *
	 * By default, the collection contains {@link #fieldView} and {@link #labelView}.
	 */ fieldWrapperChildren;
    /**
	 * Creates an instance of the labeled field view class using a provided creator function
	 * that provides the view to be labeled.
	 *
	 * @param locale The locale instance.
	 * @param viewCreator A function that returns a {@link module:ui/view~View}
	 * that will be labeled. The following arguments are passed to the creator function:
	 *
	 * * an instance of the `LabeledFieldView` to allow binding observable properties,
	 * * an UID string that connects the {@link #labelView label} and the labeled field view in DOM,
	 * * an UID string that connects the {@link #statusView status} and the labeled field view in DOM.
	 */ constructor(locale, viewCreator){
        super(locale);
        const viewUid = `ck-labeled-field-view-${uid()}`;
        const statusUid = `ck-labeled-field-view-status-${uid()}`;
        this.fieldView = viewCreator(this, viewUid, statusUid);
        this.set('label', undefined);
        this.set('isEnabled', true);
        this.set('isEmpty', true);
        this.set('isFocused', false);
        this.set('errorText', null);
        this.set('infoText', null);
        this.set('class', undefined);
        this.set('placeholder', undefined);
        this.labelView = this._createLabelView(viewUid);
        this.statusView = this._createStatusView(statusUid);
        this.fieldWrapperChildren = this.createCollection([
            this.fieldView,
            this.labelView
        ]);
        this.bind('_statusText').to(this, 'errorText', this, 'infoText', (errorText, infoText)=>errorText || infoText);
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-labeled-field-view',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', (value)=>!value),
                    bind.if('isEmpty', 'ck-labeled-field-view_empty'),
                    bind.if('isFocused', 'ck-labeled-field-view_focused'),
                    bind.if('placeholder', 'ck-labeled-field-view_placeholder'),
                    bind.if('errorText', 'ck-error')
                ]
            },
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-labeled-field-view__input-wrapper'
                        ]
                    },
                    children: this.fieldWrapperChildren
                },
                this.statusView
            ]
        });
    }
    /**
	 * Creates label view class instance and bind with view.
	 *
	 * @param id Unique id to set as labelView#for attribute.
	 */ _createLabelView(id) {
        const labelView = new LabelView(this.locale);
        labelView.for = id;
        labelView.bind('text').to(this, 'label');
        return labelView;
    }
    /**
	 * Creates the status view instance. It displays {@link #errorText} and {@link #infoText}
	 * next to the {@link #fieldView}. See {@link #_statusText}.
	 *
	 * @param statusUid Unique id of the status, shared with the {@link #fieldView view's}
	 * `aria-describedby` attribute.
	 */ _createStatusView(statusUid) {
        const statusView = new View(this.locale);
        const bind = this.bindTemplate;
        statusView.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-labeled-field-view__status',
                    bind.if('errorText', 'ck-labeled-field-view__status_error'),
                    bind.if('_statusText', 'ck-hidden', (value)=>!value)
                ],
                id: statusUid,
                role: bind.if('errorText', 'alert')
            },
            children: [
                {
                    text: bind.to('_statusText')
                }
            ]
        });
        return statusView;
    }
    /**
	 * Focuses the {@link #fieldView}.
	 */ focus(direction) {
        this.fieldView.focus(direction);
    }
}

/**
 * The base input view class.
 */ class InputBase extends View {
    /**
	 * Stores information about the editor UI focus and propagates it so various plugins and components
	 * are unified as a focus group.
	 */ focusTracker;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.set('value', undefined);
        this.set('id', undefined);
        this.set('placeholder', undefined);
        this.set('tabIndex', undefined);
        this.set('isReadOnly', false);
        this.set('hasError', false);
        this.set('ariaDescribedById', undefined);
        this.set('ariaLabel', undefined);
        this.focusTracker = new FocusTracker();
        this.bind('isFocused').to(this.focusTracker);
        this.set('isEmpty', true);
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'input',
            attributes: {
                class: [
                    'ck',
                    'ck-input',
                    bind.if('isFocused', 'ck-input_focused'),
                    bind.if('isEmpty', 'ck-input-text_empty'),
                    bind.if('hasError', 'ck-error')
                ],
                id: bind.to('id'),
                placeholder: bind.to('placeholder'),
                tabindex: bind.to('tabIndex'),
                readonly: bind.to('isReadOnly'),
                'aria-invalid': bind.if('hasError', true),
                'aria-describedby': bind.to('ariaDescribedById'),
                'aria-label': bind.to('ariaLabel')
            },
            on: {
                input: bind.to((...args)=>{
                    this.fire('input', ...args);
                    this._updateIsEmpty();
                }),
                change: bind.to(this._updateIsEmpty.bind(this))
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.focusTracker.add(this.element);
        this._setDomElementValue(this.value);
        this._updateIsEmpty();
        // Bind `this.value` to the DOM element's value.
        // We cannot use `value` DOM attribute because removing it on Edge does not clear the DOM element's value property.
        this.on('change:value', (evt, name, value)=>{
            this._setDomElementValue(value);
            this._updateIsEmpty();
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
    }
    /**
	 * Moves the focus to the input and selects the value.
	 */ select() {
        this.element.select();
    }
    /**
	 * Focuses the input.
	 */ focus() {
        this.element.focus();
    }
    /**
	 * Resets the value of the input
	 */ reset() {
        this.value = this.element.value = '';
        this._updateIsEmpty();
    }
    /**
	 * Updates the {@link #isEmpty} property value on demand.
	 */ _updateIsEmpty() {
        this.isEmpty = isInputElementEmpty(this.element);
    }
    /**
	 * Sets the `value` property of the {@link #element DOM element} on demand.
	 */ _setDomElementValue(value) {
        this.element.value = !value && value !== 0 ? '' : value;
    }
}
function isInputElementEmpty(domElement) {
    return !domElement.value;
}

/**
 * The input view class.
 */ class InputView extends InputBase {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.set('inputMode', 'text');
        const bind = this.bindTemplate;
        this.extendTemplate({
            attributes: {
                inputmode: bind.to('inputMode')
            }
        });
    }
}

/**
 * The text input view class.
 */ class InputTextView extends InputView {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.extendTemplate({
            attributes: {
                type: 'text',
                class: [
                    'ck-input-text'
                ]
            }
        });
    }
}

/**
 * The number input view class.
 */ class InputNumberView extends InputView {
    /**
	 * Creates an instance of the input number view.
	 *
	 * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
	 * @param options The options of the input.
	 * @param options.min The value of the `min` DOM attribute (the lowest accepted value).
	 * @param options.max The value of the `max` DOM attribute (the highest accepted value).
	 * @param options.step The value of the `step` DOM attribute.
	 */ constructor(locale, { min, max, step } = {}){
        super(locale);
        const bind = this.bindTemplate;
        this.set('min', min);
        this.set('max', max);
        this.set('step', step);
        this.extendTemplate({
            attributes: {
                type: 'number',
                class: [
                    'ck-input-number'
                ],
                min: bind.to('min'),
                max: bind.to('max'),
                step: bind.to('step')
            }
        });
    }
}

/**
 * The textarea view class.
 *
 * ```ts
 * const textareaView = new TextareaView();
 *
 * textareaView.minRows = 2;
 * textareaView.maxRows = 10;
 *
 * textareaView.render();
 *
 * document.body.append( textareaView.element );
 * ```
 */ class TextareaView extends InputBase {
    /**
	 * An instance of the resize observer used to detect when the view is visible or not and update
	 * its height if any changes that affect it were made while it was invisible.
	 *
	 * **Note:** Created in {@link #render}.
	 */ _resizeObserver;
    /**
	 * A flag that indicates whether the {@link #_updateAutoGrowHeight} method should be called when the view becomes
	 * visible again. See {@link #_resizeObserver}.
	 */ _isUpdateAutoGrowHeightPending = false;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const toPx = toUnit('px');
        this.set('minRows', 2);
        this.set('maxRows', 5);
        this.set('_height', null);
        this.set('resize', 'none');
        this._resizeObserver = null;
        this.on('change:minRows', this._validateMinMaxRows.bind(this));
        this.on('change:maxRows', this._validateMinMaxRows.bind(this));
        const bind = this.bindTemplate;
        this.template.tag = 'textarea';
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-textarea'
                ],
                style: {
                    height: bind.to('_height', (height)=>height ? toPx(height) : null),
                    resize: bind.to('resize')
                },
                rows: bind.to('minRows')
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        let wasVisible = false;
        this.on('input', ()=>{
            this._updateAutoGrowHeight(true);
            this.fire('update');
        });
        this.on('change:value', ()=>{
            // The content needs to be updated by the browser after the value is changed. It takes a few ms.
            global.window.requestAnimationFrame(()=>{
                if (!isVisible(this.element)) {
                    this._isUpdateAutoGrowHeightPending = true;
                    return;
                }
                this._updateAutoGrowHeight();
                this.fire('update');
            });
        });
        // It may occur that the Textarea size needs to be updated (e.g. because it's content was changed)
        // when it is not visible or detached from DOM.
        // In such case, we need to detect the moment when it becomes visible again and update its height then.
        // We're using ResizeObserver for that as it is the most reliable way to detect when the element becomes visible.
        // IntersectionObserver didn't work well with the absolute positioned containers.
        this._resizeObserver = new ResizeObserver(this.element, (evt)=>{
            const isVisible = !!evt.contentRect.width && !!evt.contentRect.height;
            if (!wasVisible && isVisible && this._isUpdateAutoGrowHeightPending) {
                // We're wrapping the auto-grow logic in RAF because otherwise there is an error thrown
                // by the browser about recursive calls to the ResizeObserver. It used to happen in unit
                // tests only, though. Since there is no risk of infinite loop here, it can stay here.
                global.window.requestAnimationFrame(()=>{
                    this._updateAutoGrowHeight();
                    this.fire('update');
                });
            }
            wasVisible = isVisible;
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        if (this._resizeObserver) {
            this._resizeObserver.destroy();
        }
    }
    /**
	 * @inheritDoc
	 */ reset() {
        super.reset();
        this._updateAutoGrowHeight();
        this.fire('update');
    }
    /**
	 * Updates the {@link #_height} of the view depending on {@link #minRows}, {@link #maxRows}, and the current content size.
	 *
	 * **Note**: This method overrides manual resize done by the user using a handle. It's a known bug.
	 */ _updateAutoGrowHeight(shouldScroll) {
        const viewElement = this.element;
        if (!viewElement.offsetParent) {
            this._isUpdateAutoGrowHeightPending = true;
            return;
        }
        this._isUpdateAutoGrowHeightPending = false;
        const singleLineContentClone = getTextareaElementClone(viewElement, '1');
        const fullTextValueClone = getTextareaElementClone(viewElement, viewElement.value);
        const singleLineContentStyles = singleLineContentClone.ownerDocument.defaultView.getComputedStyle(singleLineContentClone);
        const verticalPaddings = parseFloat(singleLineContentStyles.paddingTop) + parseFloat(singleLineContentStyles.paddingBottom);
        const borders = getBorderWidths(singleLineContentClone);
        const lineHeight = parseFloat(singleLineContentStyles.lineHeight);
        const verticalBorder = borders.top + borders.bottom;
        const singleLineAreaDefaultHeight = new Rect(singleLineContentClone).height;
        const numberOfLines = Math.round((fullTextValueClone.scrollHeight - verticalPaddings) / lineHeight);
        const maxHeight = this.maxRows * lineHeight + verticalPaddings + verticalBorder;
        // There's a --ck-ui-component-min-height CSS custom property that enforces min height of the component.
        // This min-height is relevant only when there's one line of text. Other than that, we can rely on line-height.
        const minHeight = numberOfLines === 1 ? singleLineAreaDefaultHeight : this.minRows * lineHeight + verticalPaddings + verticalBorder;
        // The size of textarea is controlled by height style instead of rows attribute because event though it is
        // a more complex solution, it is immune to the layout textarea has been rendered in (gird, flex).
        this._height = Math.min(Math.max(Math.max(numberOfLines, this.minRows) * lineHeight + verticalPaddings + verticalBorder, minHeight), maxHeight);
        if (shouldScroll) {
            viewElement.scrollTop = viewElement.scrollHeight;
        }
        singleLineContentClone.remove();
        fullTextValueClone.remove();
    }
    /**
	 * Validates the {@link #minRows} and {@link #maxRows} properties and warns in the console if the configuration is incorrect.
	 */ _validateMinMaxRows() {
        if (this.minRows > this.maxRows) {
            /**
			 * The minimum number of rows is greater than the maximum number of rows.
			 *
			 * @error ui-textarea-view-min-rows-greater-than-max-rows
			 * @param textareaView The misconfigured textarea view instance.
			 * @param minRows The value of `minRows` property.
			 * @param maxRows The value of `maxRows` property.
			 */ throw new CKEditorError('ui-textarea-view-min-rows-greater-than-max-rows', {
                textareaView: this,
                minRows: this.minRows,
                maxRows: this.maxRows
            });
        }
    }
}
function getTextareaElementClone(element, value) {
    const clone = element.cloneNode();
    clone.style.position = 'absolute';
    clone.style.top = '-99999px';
    clone.style.left = '-99999px';
    clone.style.height = 'auto';
    clone.style.overflow = 'hidden';
    clone.style.width = element.ownerDocument.defaultView.getComputedStyle(element).width;
    clone.tabIndex = -1;
    clone.rows = 1;
    clone.value = value;
    element.parentNode.insertBefore(clone, element);
    return clone;
}

/**
 * The dropdown panel view class.
 *
 * See {@link module:ui/dropdown/dropdownview~DropdownView} to learn about the common usage.
 */ class DropdownPanelView extends View {
    /**
	 * Collection of the child views in this panel.
	 *
	 * A common child type is the {@link module:ui/list/listview~ListView} and {@link module:ui/toolbar/toolbarview~ToolbarView}.
	 * See {@link module:ui/dropdown/utils~addListToDropdown} and
	 * {@link module:ui/dropdown/utils~addToolbarToDropdown} to learn more about child views of dropdowns.
	 */ children;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isVisible', false);
        this.set('position', 'se');
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-reset',
                    'ck-dropdown__panel',
                    bind.to('position', (value)=>`ck-dropdown__panel_${value}`),
                    bind.if('isVisible', 'ck-dropdown__panel-visible')
                ],
                tabindex: '-1'
            },
            children: this.children,
            on: {
                // Drag and drop in the panel should not break the selection in the editor.
                // https://github.com/ckeditor/ckeditor5-ui/issues/228
                selectstart: bind.to((evt)=>{
                    if (evt.target.tagName.toLocaleLowerCase() === 'input') {
                        return;
                    }
                    evt.preventDefault();
                })
            }
        });
    }
    /**
	 * Focuses the first view in the {@link #children} collection.
	 *
	 * See also {@link module:ui/dropdown/dropdownpanelfocusable~DropdownPanelFocusable}.
	 */ focus() {
        if (this.children.length) {
            const firstChild = this.children.first;
            if (typeof firstChild.focus === 'function') {
                firstChild.focus();
            } else {
                /**
				 * The child view of a dropdown could not be focused because it is missing the `focus()` method.
				 *
				 * This warning appears when a dropdown {@link module:ui/dropdown/dropdownview~DropdownView#isOpen gets open} and it
				 * attempts to focus the {@link module:ui/dropdown/dropdownpanelview~DropdownPanelView#children first child} of its panel
				 * but the child does not implement the
				 * {@link module:ui/dropdown/dropdownpanelfocusable~DropdownPanelFocusable focusable interface}.
				 *
				 * Focusing the content of a dropdown on open greatly improves the accessibility. Please make sure the view instance
				 * provides the `focus()` method for the best user experience.
				 *
				 * @error ui-dropdown-panel-focus-child-missing-focus
				 * @param childView
				 * @param dropdownPanel
				 */ logWarning('ui-dropdown-panel-focus-child-missing-focus', {
                    childView: this.children.first,
                    dropdownPanel: this
                });
            }
        }
    }
    /**
	 * Focuses the view element or last item in view collection on opening dropdown's panel.
	 *
	 * See also {@link module:ui/dropdown/dropdownpanelfocusable~DropdownPanelFocusable}.
	 */ focusLast() {
        if (this.children.length) {
            const lastChild = this.children.last;
            if (typeof lastChild.focusLast === 'function') {
                lastChild.focusLast();
            } else {
                lastChild.focus();
            }
        }
    }
}

/**
 * The dropdown view class. It manages the dropdown button and dropdown panel.
 *
 * In most cases, the easiest way to create a dropdown is by using the {@link module:ui/dropdown/utils~createDropdown}
 * util:
 *
 * ```ts
 * const dropdown = createDropdown( locale );
 *
 * // Configure dropdown's button properties:
 * dropdown.buttonView.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.render();
 *
 * dropdown.panelView.element.textContent = 'Content of the panel';
 *
 * // Will render a dropdown with a panel containing a "Content of the panel" text.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * If you want to add a richer content to the dropdown panel, you can use the {@link module:ui/dropdown/utils~addListToDropdown}
 * and {@link module:ui/dropdown/utils~addToolbarToDropdown} helpers. See more examples in
 * {@link module:ui/dropdown/utils~createDropdown} documentation.
 *
 * If you want to create a completely custom dropdown, then you can compose it manually:
 *
 * ```ts
 * const button = new DropdownButtonView( locale );
 * const panel = new DropdownPanelView( locale );
 * const dropdown = new DropdownView( locale, button, panel );
 *
 * button.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.render();
 *
 * panel.element.textContent = 'Content of the panel';
 *
 * // Will render a dropdown with a panel containing a "Content of the panel" text.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * However, dropdown created this way will contain little behavior. You will need to implement handlers for actions
 * such as {@link module:ui/bindings/clickoutsidehandler~clickOutsideHandler clicking outside an open dropdown}
 * (which should close it) and support for arrow keys inside the panel. Therefore, unless you really know what
 * you do and you really need to do it, it is recommended to use the {@link module:ui/dropdown/utils~createDropdown} helper.
 */ class DropdownView extends View {
    /**
	 * Button of the dropdown view. Clicking the button opens the {@link #panelView}.
	 */ buttonView;
    /**
	 * Panel of the dropdown. It opens when the {@link #buttonView} is
	 * {@link module:ui/button/button~Button#event:execute executed} (i.e. clicked).
	 *
	 * Child views can be added to the panel's `children` collection:
	 *
	 * ```ts
	 * dropdown.panelView.children.add( childView );
	 * ```
	 *
	 * See {@link module:ui/dropdown/dropdownpanelview~DropdownPanelView#children} and
	 * {@link module:ui/viewcollection~ViewCollection#add}.
	 */ panelView;
    /**
	 * Tracks information about the DOM focus in the dropdown.
	 */ focusTracker;
    /**
	 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}. It manages
	 * keystrokes of the dropdown:
	 *
	 * * <kbd>▼</kbd> opens the dropdown,
	 * * <kbd>◀</kbd> and <kbd>Esc</kbd> closes the dropdown.
	 */ keystrokes;
    /**
	 * A child {@link module:ui/list/listview~ListView list view} of the dropdown located
	 * in its {@link module:ui/dropdown/dropdownview~DropdownView#panelView panel}.
	 *
	 * **Note**: Only supported when dropdown has list view added using {@link module:ui/dropdown/utils~addListToDropdown}.
	 */ listView;
    /**
	 * A child toolbar of the dropdown located in the
	 * {@link module:ui/dropdown/dropdownview~DropdownView#panelView panel}.
	 *
	 * **Note**: Only supported when dropdown has list view added using {@link module:ui/dropdown/utils~addToolbarToDropdown}.
	 */ toolbarView;
    /**
	 * Creates an instance of the dropdown.
	 *
	 * Also see {@link #render}.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale, buttonView, panelView){
        super(locale);
        const bind = this.bindTemplate;
        this.buttonView = buttonView;
        this.panelView = panelView;
        this.set('isOpen', false);
        this.set('isEnabled', true);
        this.set('class', undefined);
        this.set('id', undefined);
        this.set('panelPosition', 'auto');
        // Toggle the visibility of the panel when the dropdown becomes open.
        this.panelView.bind('isVisible').to(this, 'isOpen');
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-dropdown',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', (value)=>!value)
                ],
                id: bind.to('id'),
                'aria-describedby': bind.to('ariaDescribedById')
            },
            children: [
                buttonView,
                panelView
            ]
        });
        buttonView.extendTemplate({
            attributes: {
                class: [
                    'ck-dropdown__button'
                ],
                'data-cke-tooltip-disabled': bind.to('isOpen')
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.focusTracker.add(this.buttonView.element);
        this.focusTracker.add(this.panelView.element);
        // Toggle the dropdown when its button has been clicked.
        this.listenTo(this.buttonView, 'open', ()=>{
            this.isOpen = !this.isOpen;
        });
        // Let the dropdown control the position of the panel. The position must
        // be updated every time the dropdown is open.
        this.on('change:isOpen', (evt, name, isOpen)=>{
            if (!isOpen) {
                return;
            }
            // If "auto", find the best position of the panel to fit into the viewport.
            // Otherwise, simply assign the static position.
            if (this.panelPosition === 'auto') {
                const optimalPanelPosition = DropdownView._getOptimalPosition({
                    element: this.panelView.element,
                    target: this.buttonView.element,
                    fitInViewport: true,
                    positions: this._panelPositions
                });
                this.panelView.position = optimalPanelPosition ? optimalPanelPosition.name : this._panelPositions[0].name;
            } else {
                this.panelView.position = this.panelPosition;
            }
        });
        // Listen for keystrokes coming from within #element.
        this.keystrokes.listenTo(this.element);
        const closeDropdown = (data, cancel)=>{
            if (this.isOpen) {
                this.isOpen = false;
                cancel();
            }
        };
        // Open the dropdown panel using the arrow down key, just like with return or space.
        this.keystrokes.set('arrowdown', (data, cancel)=>{
            // Don't open if the dropdown is disabled or already open.
            if (this.buttonView.isEnabled && !this.isOpen) {
                this.isOpen = true;
                cancel();
            }
        });
        // Block the right arrow key (until nested dropdowns are implemented).
        this.keystrokes.set('arrowright', (data, cancel)=>{
            if (this.isOpen) {
                cancel();
            }
        });
        // Close the dropdown using the arrow left/escape key.
        this.keystrokes.set('arrowleft', closeDropdown);
        this.keystrokes.set('esc', closeDropdown);
    }
    /**
	 * Focuses the {@link #buttonView}.
	 */ focus() {
        this.buttonView.focus();
    }
    /**
	 * Returns {@link #panelView panel} positions to be used by the
	 * {@link module:utils/dom/position~getOptimalPosition `getOptimalPosition()`}
	 * utility considering the direction of the language the UI of the editor is displayed in.
	 */ get _panelPositions() {
        const { south, north, southEast, southWest, northEast, northWest, southMiddleEast, southMiddleWest, northMiddleEast, northMiddleWest } = DropdownView.defaultPanelPositions;
        if (this.locale.uiLanguageDirection !== 'rtl') {
            return [
                southEast,
                southWest,
                southMiddleEast,
                southMiddleWest,
                south,
                northEast,
                northWest,
                northMiddleEast,
                northMiddleWest,
                north
            ];
        } else {
            return [
                southWest,
                southEast,
                southMiddleWest,
                southMiddleEast,
                south,
                northWest,
                northEast,
                northMiddleWest,
                northMiddleEast,
                north
            ];
        }
    }
    /**
	 * A set of positioning functions used by the dropdown view to determine
	 * the optimal position (i.e. fitting into the browser viewport) of its
	 * {@link module:ui/dropdown/dropdownview~DropdownView#panelView panel} when
	 * {@link module:ui/dropdown/dropdownview~DropdownView#panelPosition} is set to 'auto'`.
	 *
	 * The available positioning functions are as follow:
	 *
	 * **South**
	 *
	 * * `south`
	 *
	 * ```
	 *			[ Button ]
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 * ```
	 *
	 * * `southEast`
	 *
	 * ```
	 *		[ Button ]
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 * ```
	 *
	 * * `southWest`
	 *
	 * ```
	 *		         [ Button ]
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 * ```
	 *
	 * * `southMiddleEast`
	 *
	 * ```
	 *		  [ Button ]
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 * ```
	 *
	 * * `southMiddleWest`
	 *
	 * ```
	 *		       [ Button ]
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 * ```
	 *
	 * **North**
	 *
	 * * `north`
	 *
	 * ```
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 *		    [ Button ]
	 * ```
	 *
	 * * `northEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 *		[ Button ]
	 * ```
	 *
	 * * `northWest`
	 *
	 * ```
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 *		         [ Button ]
	 * ```
	 *
	 * * `northMiddleEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 *		  [ Button ]
	 * ```
	 *
	 * * `northMiddleWest`
	 *
	 * ```
	 *		+-----------------+
	 *		|      Panel      |
	 *		+-----------------+
	 *		       [ Button ]
	 * ```
	 *
	 * Positioning functions are compatible with {@link module:utils/dom/position~DomPoint}.
	 *
	 * The name that position function returns will be reflected in dropdown panel's class that
	 * controls its placement. See {@link module:ui/dropdown/dropdownview~DropdownView#panelPosition}
	 * to learn more.
	 */ static defaultPanelPositions = {
        south: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.bottom,
                left: buttonRect.left - (panelRect.width - buttonRect.width) / 2,
                name: 's'
            };
        },
        southEast: (buttonRect)=>{
            return {
                top: buttonRect.bottom,
                left: buttonRect.left,
                name: 'se'
            };
        },
        southWest: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.bottom,
                left: buttonRect.left - panelRect.width + buttonRect.width,
                name: 'sw'
            };
        },
        southMiddleEast: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.bottom,
                left: buttonRect.left - (panelRect.width - buttonRect.width) / 4,
                name: 'sme'
            };
        },
        southMiddleWest: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.bottom,
                left: buttonRect.left - (panelRect.width - buttonRect.width) * 3 / 4,
                name: 'smw'
            };
        },
        north: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.top - panelRect.height,
                left: buttonRect.left - (panelRect.width - buttonRect.width) / 2,
                name: 'n'
            };
        },
        northEast: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.top - panelRect.height,
                left: buttonRect.left,
                name: 'ne'
            };
        },
        northWest: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.top - panelRect.height,
                left: buttonRect.left - panelRect.width + buttonRect.width,
                name: 'nw'
            };
        },
        northMiddleEast: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.top - panelRect.height,
                left: buttonRect.left - (panelRect.width - buttonRect.width) / 4,
                name: 'nme'
            };
        },
        northMiddleWest: (buttonRect, panelRect)=>{
            return {
                top: buttonRect.top - panelRect.height,
                left: buttonRect.left - (panelRect.width - buttonRect.width) * 3 / 4,
                name: 'nmw'
            };
        }
    };
    /**
	 * A function used to calculate the optimal position for the dropdown panel.
	 */ static _getOptimalPosition = getOptimalPosition;
}

/**
 * The default dropdown button view class.
 *
 * ```ts
 * const view = new DropdownButtonView();
 *
 * view.set( {
 * 	label: 'A button',
 * 	keystroke: 'Ctrl+B',
 * 	tooltip: true
 * } );
 *
 * view.render();
 *
 * document.body.append( view.element );
 * ```
 *
 * Also see the {@link module:ui/dropdown/utils~createDropdown `createDropdown()` util}.
 */ class DropdownButtonView extends ButtonView {
    /**
	 * An icon that displays arrow to indicate a dropdown button.
	 */ arrowView;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.arrowView = this._createArrowView();
        this.extendTemplate({
            attributes: {
                'aria-haspopup': true,
                'aria-expanded': this.bindTemplate.to('isOn', (value)=>String(value))
            }
        });
        // The DropdownButton interface expects the open event upon which will open the dropdown.
        this.delegate('execute').to(this, 'open');
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.add(this.arrowView);
    }
    /**
	 * Creates a {@link module:ui/icon/iconview~IconView} instance as {@link #arrowView}.
	 */ _createArrowView() {
        const arrowView = new IconView();
        arrowView.content = dropdownArrowIcon;
        arrowView.extendTemplate({
            attributes: {
                class: 'ck-dropdown__arrow'
            }
        });
        return arrowView;
    }
}

/**
 * The toolbar separator view class.
 */ class ToolbarSeparatorView extends View {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-toolbar__separator'
                ]
            }
        });
    }
}

/**
 * The toolbar line break view class.
 */ class ToolbarLineBreakView extends View {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-toolbar__line-break'
                ]
            }
        });
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/bindings/preventdefault
 */ /**
 * A helper which executes a native `Event.preventDefault()` if the target of an event equals the
 * {@link module:ui/view~View#element element of the view}. It shortens the definition of a
 * {@link module:ui/view~View#template template}.
 *
 * ```ts
 * // In a class extending View.
 * import preventDefault from '@ckeditor/ckeditor5-ui/src/bindings/preventdefault';
 *
 * // ...
 *
 * this.setTemplate( {
 * 	tag: 'div',
 *
 * 	on: {
 * 		// Prevent the default mousedown action on this view.
 * 		mousedown: preventDefault( this )
 * 	}
 * } );
 * ```
 *
 * @param view View instance that defines the template.
 */ function preventDefault(view) {
    return view.bindTemplate.to((evt)=>{
        if (evt.target === view.element) {
            evt.preventDefault();
        }
    });
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module ui/toolbar/normalizetoolbarconfig
 */ /**
 * Normalizes the toolbar configuration (`config.toolbar`), which:
 *
 * * may be defined as an `Array`:
 *
 * ```
 * toolbar: [ 'heading', 'bold', 'italic', 'link', ... ]
 * ```
 *
 * * or an `Object`:
 *
 * ```
 * toolbar: {
 * 	items: [ 'heading', 'bold', 'italic', 'link', ... ],
 * 	removeItems: [ 'bold' ],
 * 	...
 * }
 * ```
 *
 * * or may not be defined at all (`undefined`)
 *
 * and returns it in the object form.
 *
 * @param config The value of `config.toolbar`.
 * @returns A normalized toolbar config object.
 */ function normalizeToolbarConfig(config) {
    if (Array.isArray(config)) {
        return {
            items: config,
            removeItems: []
        };
    }
    const predefinedConfigOptions = {
        items: [],
        removeItems: []
    };
    if (!config) {
        return predefinedConfigOptions;
    }
    return {
        ...predefinedConfigOptions,
        ...config
    };
}

const NESTED_TOOLBAR_ICONS = /* #__PURE__ */ (()=>({
        alignLeft: icons.alignLeft,
        bold: icons.bold,
        importExport: icons.importExport,
        paragraph: icons.paragraph,
        plus: icons.plus,
        text: icons.text,
        threeVerticalDots: icons.threeVerticalDots,
        pilcrow: icons.pilcrow,
        dragIndicator: icons.dragIndicator
    }))();
/**
 * The toolbar view class.
 */ class ToolbarView extends View {
    /**
	 * A reference to the options object passed to the constructor.
	 */ options;
    /**
	 * A collection of toolbar items (buttons, dropdowns, etc.).
	 */ items;
    /**
	 * Tracks information about the DOM focus in the toolbar.
	 */ focusTracker;
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}
	 * to handle keyboard navigation in the toolbar.
	 */ keystrokes;
    /**
	 * A (child) view containing {@link #items toolbar items}.
	 */ itemsView;
    /**
	 * A top–level collection aggregating building blocks of the toolbar.
	 *
	 *	┌───────────────── ToolbarView ─────────────────┐
	 *	| ┌──────────────── #children ────────────────┐ |
	 *	| |   ┌──────────── #itemsView ───────────┐   | |
	 *	| |   | [ item1 ] [ item2 ] ... [ itemN ] |   | |
	 *	| |   └──────────────────────────────────-┘   | |
	 *	| └───────────────────────────────────────────┘ |
	 *	└───────────────────────────────────────────────┘
	 *
	 * By default, it contains the {@link #itemsView} but it can be extended with additional
	 * UI elements when necessary.
	 */ children;
    /**
	 * A collection of {@link #items} that take part in the focus cycling
	 * (i.e. navigation using the keyboard). Usually, it contains a subset of {@link #items} with
	 * some optional UI elements that also belong to the toolbar and should be focusable
	 * by the user.
	 */ focusables;
    /**
	 * Helps cycling over {@link #focusables focusable items} in the toolbar.
	 */ _focusCycler;
    /**
	 * An instance of the active toolbar behavior that shapes its look and functionality.
	 *
	 * See {@link module:ui/toolbar/toolbarview~ToolbarBehavior} to learn more.
	 */ _behavior;
    /**
	 * Creates an instance of the {@link module:ui/toolbar/toolbarview~ToolbarView} class.
	 *
	 * Also see {@link #render}.
	 *
	 * @param locale The localization services instance.
	 * @param options Configuration options of the toolbar.
	 */ constructor(locale, options){
        super(locale);
        const bind = this.bindTemplate;
        const t = this.t;
        this.options = options || {};
        this.set('ariaLabel', t('Editor toolbar'));
        this.set('maxWidth', 'auto');
        this.items = this.createCollection();
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this.set('class', undefined);
        this.set('isCompact', false);
        this.itemsView = new ItemsView(locale);
        this.children = this.createCollection();
        this.children.add(this.itemsView);
        this.focusables = this.createCollection();
        const isRtl = locale.uiLanguageDirection === 'rtl';
        this._focusCycler = new FocusCycler({
            focusables: this.focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate toolbar items backwards using the arrow[left,up] keys.
                focusPrevious: [
                    isRtl ? 'arrowright' : 'arrowleft',
                    'arrowup'
                ],
                // Navigate toolbar items forwards using the arrow[right,down] keys.
                focusNext: [
                    isRtl ? 'arrowleft' : 'arrowright',
                    'arrowdown'
                ]
            }
        });
        const classes = [
            'ck',
            'ck-toolbar',
            bind.to('class'),
            bind.if('isCompact', 'ck-toolbar_compact')
        ];
        if (this.options.shouldGroupWhenFull && this.options.isFloating) {
            classes.push('ck-toolbar_floating');
        }
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: classes,
                role: 'toolbar',
                'aria-label': bind.to('ariaLabel'),
                style: {
                    maxWidth: bind.to('maxWidth')
                },
                tabindex: -1
            },
            children: this.children,
            on: {
                // https://github.com/ckeditor/ckeditor5-ui/issues/206
                mousedown: preventDefault(this)
            }
        });
        this._behavior = this.options.shouldGroupWhenFull ? new DynamicGrouping(this) : new StaticLayout(this);
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.focusTracker.add(this.element);
        // Children added before rendering should be known to the #focusTracker.
        for (const item of this.items){
            this.focusTracker.add(item.element);
        }
        this.items.on('add', (evt, item)=>{
            this.focusTracker.add(item.element);
        });
        this.items.on('remove', (evt, item)=>{
            this.focusTracker.remove(item.element);
        });
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
        this._behavior.render(this);
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        this._behavior.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
        return super.destroy();
    }
    /**
	 * Focuses the first focusable in {@link #focusables}.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the last focusable in {@link #focusables}.
	 */ focusLast() {
        this._focusCycler.focusLast();
    }
    /**
	 * A utility that expands the plain toolbar configuration into
	 * {@link module:ui/toolbar/toolbarview~ToolbarView#items} using a given component factory.
	 *
	 * @param itemsOrConfig The toolbar items or the entire toolbar configuration object.
	 * @param factory A factory producing toolbar items.
	 * @param removeItems An array of items names to be removed from the configuration. When present, applies
	 * to this toolbar and all nested ones as well.
	 */ fillFromConfig(itemsOrConfig, factory, removeItems) {
        this.items.addMany(this._buildItemsFromConfig(itemsOrConfig, factory, removeItems));
    }
    /**
	 * A utility that expands the plain toolbar configuration into a list of view items using a given component factory.
	 *
	 * @param itemsOrConfig The toolbar items or the entire toolbar configuration object.
	 * @param factory A factory producing toolbar items.
	 * @param removeItems An array of items names to be removed from the configuration. When present, applies
	 * to this toolbar and all nested ones as well.
	 */ _buildItemsFromConfig(itemsOrConfig, factory, removeItems) {
        const config = normalizeToolbarConfig(itemsOrConfig);
        const normalizedRemoveItems = removeItems || config.removeItems;
        const itemsToAdd = this._cleanItemsConfiguration(config.items, factory, normalizedRemoveItems).map((item)=>{
            if (isObject(item)) {
                return this._createNestedToolbarDropdown(item, factory, normalizedRemoveItems);
            } else if (item === '|') {
                return new ToolbarSeparatorView();
            } else if (item === '-') {
                return new ToolbarLineBreakView();
            }
            return factory.create(item);
        }).filter((item)=>!!item);
        return itemsToAdd;
    }
    /**
	 * Cleans up the {@link module:ui/toolbar/toolbarview~ToolbarView#items} of the toolbar by removing unwanted items and
	 * duplicated (obsolete) separators or line breaks.
	 *
	 * @param items The toolbar items configuration.
	 * @param factory A factory producing toolbar items.
	 * @param removeItems An array of items names to be removed from the configuration.
	 * @returns Items after the clean-up.
	 */ _cleanItemsConfiguration(items, factory, removeItems) {
        const filteredItems = items.filter((item, idx, items)=>{
            if (item === '|') {
                return true;
            }
            // Items listed in `config.removeItems` should not be added to the toolbar.
            if (removeItems.indexOf(item) !== -1) {
                return false;
            }
            if (item === '-') {
                // The toolbar line breaks must not be rendered when toolbar grouping is enabled.
                // (https://github.com/ckeditor/ckeditor5/issues/8582)
                if (this.options.shouldGroupWhenFull) {
                    /**
						 * The toolbar multiline breaks (`-` items) only work when the automatic button grouping
						 * is disabled in the toolbar configuration.
						 * To do this, set the `shouldNotGroupWhenFull` option to `true` in the editor configuration:
						 *
						 * ```ts
						 * const config = {
						 * 	toolbar: {
						 * 		items: [ ... ],
						 * 		shouldNotGroupWhenFull: true
						 * 	}
						 * }
						 * ```
						 *
						 * Learn more about {@link module:core/editor/editorconfig~EditorConfig#toolbar toolbar configuration}.
						 *
						 * @error toolbarview-line-break-ignored-when-grouping-items
						 */ logWarning('toolbarview-line-break-ignored-when-grouping-items', items);
                    return false;
                }
                return true;
            }
            // For the items that cannot be instantiated we are sending warning message. We also filter them out.
            if (!isObject(item) && !factory.has(item)) {
                /**
					 * There was a problem processing the configuration of the toolbar. The item with the given
					 * name does not exist so it was omitted when rendering the toolbar.
					 *
					 * This warning usually shows up when the {@link module:core/plugin~Plugin} which is supposed
					 * to provide a toolbar item has not been loaded or there is a typo in the
					 * {@link module:core/editor/editorconfig~EditorConfig#toolbar toolbar configuration}.
					 *
					 * Make sure the plugin responsible for this toolbar item is loaded and the toolbar configuration
					 * is correct, e.g. {@link module:basic-styles/bold~Bold} is loaded for the `'bold'` toolbar item.
					 *
					 * You can use the following snippet to retrieve all available toolbar items:
					 *
					 * ```ts
					 * Array.from( editor.ui.componentFactory.names() );
					 * ```
					 *
					 * @error toolbarview-item-unavailable
					 * @param item The name of the component or nested toolbar definition.
					 */ logWarning('toolbarview-item-unavailable', {
                    item
                });
                return false;
            }
            return true;
        });
        return this._cleanSeparatorsAndLineBreaks(filteredItems);
    }
    /**
	 * Remove leading, trailing, and duplicated separators (`-` and `|`).
	 *
	 * @returns Toolbar items after the separator and line break clean-up.
	 */ _cleanSeparatorsAndLineBreaks(items) {
        const nonSeparatorPredicate = (item)=>item !== '-' && item !== '|';
        const count = items.length;
        // Find an index of the first item that is not a separator.
        const firstCommandItemIndex = items.findIndex(nonSeparatorPredicate);
        // Items include separators only. There is no point in displaying them.
        if (firstCommandItemIndex === -1) {
            return [];
        }
        // Search from the end of the list, then convert found index back to the original direction.
        const lastCommandItemIndex = count - items.slice().reverse().findIndex(nonSeparatorPredicate);
        return items// Return items without the leading and trailing separators.
        .slice(firstCommandItemIndex, lastCommandItemIndex)// Remove duplicated separators.
        .filter((name, idx, items)=>{
            // Filter only separators.
            if (nonSeparatorPredicate(name)) {
                return true;
            }
            const isDuplicated = idx > 0 && items[idx - 1] === name;
            return !isDuplicated;
        });
    }
    /**
	 * Creates a user-defined dropdown containing a toolbar with items.
	 *
	 * @param definition A definition of the nested toolbar dropdown.
	 * @param definition.label A label of the dropdown.
	 * @param definition.icon An icon of the drop-down. One of 'bold', 'plus', 'text', 'importExport', 'alignLeft',
	 * 'paragraph' or an SVG string. When `false` is passed, no icon will be used.
	 * @param definition.withText When set `true`, the label of the dropdown will be visible. See
	 * {@link module:ui/button/buttonview~ButtonView#withText} to learn more.
	 * @param definition.tooltip A tooltip of the dropdown button. See
	 * {@link module:ui/button/buttonview~ButtonView#tooltip} to learn more. Defaults to `true`.
	 * @param componentFactory Component factory used to create items
	 * of the nested toolbar.
	 */ _createNestedToolbarDropdown(definition, componentFactory, removeItems) {
        let { label, icon, items, tooltip = true, withText = false } = definition;
        items = this._cleanItemsConfiguration(items, componentFactory, removeItems);
        // There is no point in rendering a dropdown without items.
        if (!items.length) {
            return null;
        }
        const locale = this.locale;
        const dropdownView = createDropdown(locale);
        if (!label) {
            /**
			 * A dropdown definition in the toolbar configuration is missing a text label.
			 *
			 * Without a label, the dropdown becomes inaccessible to users relying on assistive technologies.
			 * Make sure the `label` property is set in your drop-down configuration:
			 *
			 * ```json
 			 * {
 			 * 	label: 'A human-readable label',
			 * 	icon: '...',
			 * 	items: [ ... ]
 			 * },
			 * ```
			 *
			 * Learn more about {@link module:core/editor/editorconfig~EditorConfig#toolbar toolbar configuration}.
			 *
			 * @error toolbarview-nested-toolbar-dropdown-missing-label
			 */ logWarning('toolbarview-nested-toolbar-dropdown-missing-label', definition);
        }
        dropdownView.class = 'ck-toolbar__nested-toolbar-dropdown';
        dropdownView.buttonView.set({
            label,
            tooltip,
            withText: !!withText
        });
        // Allow disabling icon by passing false.
        if (icon !== false) {
            // A pre-defined icon picked by name, SVG string, a fallback (default) icon.
            dropdownView.buttonView.icon = NESTED_TOOLBAR_ICONS[icon] || icon || icons.threeVerticalDots;
        } else {
            dropdownView.buttonView.withText = true;
        }
        addToolbarToDropdown(dropdownView, ()=>dropdownView.toolbarView._buildItemsFromConfig(items, componentFactory, removeItems));
        return dropdownView;
    }
}
/**
 * An inner block of the {@link module:ui/toolbar/toolbarview~ToolbarView} hosting its
 * {@link module:ui/toolbar/toolbarview~ToolbarView#items}.
 */ class ItemsView extends View {
    /**
	 * A collection of items (buttons, dropdowns, etc.).
	 */ children;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-toolbar__items'
                ]
            },
            children: this.children
        });
    }
}
/**
 * A toolbar behavior that makes it static and unresponsive to the changes of the environment.
 * At the same time, it also makes it possible to display a toolbar with a vertical layout
 * using the {@link module:ui/toolbar/toolbarview~ToolbarView#isVertical} property.
 */ class StaticLayout {
    /**
	 * Creates an instance of the {@link module:ui/toolbar/toolbarview~StaticLayout} toolbar
	 * behavior.
	 *
	 * @param view An instance of the toolbar that this behavior is added to.
	 */ constructor(view){
        const bind = view.bindTemplate;
        // Static toolbar can be vertical when needed.
        view.set('isVertical', false);
        // 1:1 pass–through binding, all ToolbarView#items are visible.
        view.itemsView.children.bindTo(view.items).using((item)=>item);
        // 1:1 pass–through binding, all ToolbarView#items are focusable.
        view.focusables.bindTo(view.items).using((item)=>isFocusable(item) ? item : null);
        view.extendTemplate({
            attributes: {
                class: [
                    // When vertical, the toolbar has an additional CSS class.
                    bind.if('isVertical', 'ck-toolbar_vertical')
                ]
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {}
    /**
	 * @inheritDoc
	 */ destroy() {}
}
/**
 * A toolbar behavior that makes the items respond to changes in the geometry.
 *
 * In a nutshell, it groups {@link module:ui/toolbar/toolbarview~ToolbarView#items}
 * that do not fit visually into a single row of the toolbar (due to limited space).
 * Items that do not fit are aggregated in a dropdown displayed at the end of the toolbar.
 *
 * ```
 *	┌──────────────────────────────────────── ToolbarView ──────────────────────────────────────────┐
 *	| ┌─────────────────────────────────────── #children ─────────────────────────────────────────┐ |
 *	| |   ┌─────── #itemsView ────────┐ ┌──────────────────────┐ ┌── #groupedItemsDropdown ───┐   | |
 *	| |   |       #ungroupedItems     | | ToolbarSeparatorView | |        #groupedItems       |   | |
 *	| |   └──────────────────────────-┘ └──────────────────────┘ └────────────────────────────┘   | |
 *	| |                                  \---------- only when toolbar items overflow -------/    | |
 *	| └───────────────────────────────────────────────────────────────────────────────────────────┘ |
 *	└───────────────────────────────────────────────────────────────────────────────────────────────┘
 * ```
 */ class DynamicGrouping {
    /**
	 * A toolbar view this behavior belongs to.
	 */ view;
    /**
	 * A collection of toolbar children.
	 */ viewChildren;
    /**
	 * A collection of focusable toolbar elements.
	 */ viewFocusables;
    /**
	 * A view containing toolbar items.
	 */ viewItemsView;
    /**
	 * Toolbar focus tracker.
	 */ viewFocusTracker;
    /**
	 * Toolbar locale.
	 */ viewLocale;
    /**
	 * A subset of toolbar {@link module:ui/toolbar/toolbarview~ToolbarView#items}.
	 * Aggregates items that fit into a single row of the toolbar and were not {@link #groupedItems grouped}
	 * into a {@link #groupedItemsDropdown dropdown}. Items of this collection are displayed in the
	 * {@link module:ui/toolbar/toolbarview~ToolbarView#itemsView}.
	 *
	 * When none of the {@link module:ui/toolbar/toolbarview~ToolbarView#items} were grouped, it
	 * matches the {@link module:ui/toolbar/toolbarview~ToolbarView#items} collection in size and order.
	 */ ungroupedItems;
    /**
	 * A subset of toolbar {@link module:ui/toolbar/toolbarview~ToolbarView#items}.
	 * A collection of the toolbar items that do not fit into a single row of the toolbar.
	 * Grouped items are displayed in a dedicated {@link #groupedItemsDropdown dropdown}.
	 *
	 * When none of the {@link module:ui/toolbar/toolbarview~ToolbarView#items} were grouped,
	 * this collection is empty.
	 */ groupedItems;
    /**
	 * The dropdown that aggregates {@link #groupedItems grouped items} that do not fit into a single
	 * row of the toolbar. It is displayed on demand as the last of
	 * {@link module:ui/toolbar/toolbarview~ToolbarView#children toolbar children} and offers another
	 * (nested) toolbar which displays items that would normally overflow.
	 */ groupedItemsDropdown;
    /**
	 * An instance of the resize observer that helps dynamically determine the geometry of the toolbar
	 * and manage items that do not fit into a single row.
	 *
	 * **Note:** Created in {@link #_enableGroupingOnResize}.
	 *
	 * @readonly
	 */ resizeObserver = null;
    /**
	 * A cached value of the horizontal padding style used by {@link #_updateGrouping}
	 * to manage the {@link module:ui/toolbar/toolbarview~ToolbarView#items} that do not fit into
	 * a single toolbar line. This value can be reused between updates because it is unlikely that
	 * the padding will change and re–using `Window.getComputedStyle()` is expensive.
	 *
	 * @readonly
	 */ cachedPadding = null;
    /**
	 * A flag indicating that an items grouping update has been queued (e.g. due to the toolbar being visible)
	 * and should be executed immediately the next time the toolbar shows up.
	 *
	 * @readonly
	 */ shouldUpdateGroupingOnNextResize = false;
    /**
	 * Toolbar element.
	 *
	 * @readonly
	 */ viewElement;
    /**
	 * Creates an instance of the {@link module:ui/toolbar/toolbarview~DynamicGrouping} toolbar
	 * behavior.
	 *
	 * @param view An instance of the toolbar that this behavior is added to.
	 */ constructor(view){
        this.view = view;
        this.viewChildren = view.children;
        this.viewFocusables = view.focusables;
        this.viewItemsView = view.itemsView;
        this.viewFocusTracker = view.focusTracker;
        this.viewLocale = view.locale;
        this.ungroupedItems = view.createCollection();
        this.groupedItems = view.createCollection();
        this.groupedItemsDropdown = this._createGroupedItemsDropdown();
        // Only those items that were not grouped are visible to the user.
        view.itemsView.children.bindTo(this.ungroupedItems).using((item)=>item);
        // Make sure all #items visible in the main space of the toolbar are "focuscyclable".
        this.ungroupedItems.on('change', this._updateFocusCyclableItems.bind(this));
        // Make sure the #groupedItemsDropdown is also included in cycling when it appears.
        view.children.on('change', this._updateFocusCyclableItems.bind(this));
        // ToolbarView#items is dynamic. When an item is added or removed, it should be automatically
        // represented in either grouped or ungrouped items at the right index.
        // In other words #items == concat( #ungroupedItems, #groupedItems )
        // (in length and order).
        view.items.on('change', (evt, changeData)=>{
            const index = changeData.index;
            const added = Array.from(changeData.added);
            // Removing.
            for (const removedItem of changeData.removed){
                if (index >= this.ungroupedItems.length) {
                    this.groupedItems.remove(removedItem);
                } else {
                    this.ungroupedItems.remove(removedItem);
                }
            }
            // Adding.
            for(let currentIndex = index; currentIndex < index + added.length; currentIndex++){
                const addedItem = added[currentIndex - index];
                if (currentIndex > this.ungroupedItems.length) {
                    this.groupedItems.add(addedItem, currentIndex - this.ungroupedItems.length);
                } else {
                    this.ungroupedItems.add(addedItem, currentIndex);
                }
            }
            // When new ungrouped items join in and land in #ungroupedItems, there's a chance it causes
            // the toolbar to overflow.
            // Consequently if removed from grouped or ungrouped items, there is a chance
            // some new space is available and we could do some ungrouping.
            this._updateGrouping();
        });
        view.extendTemplate({
            attributes: {
                class: [
                    // To group items dynamically, the toolbar needs a dedicated CSS class.
                    'ck-toolbar_grouping'
                ]
            }
        });
    }
    /**
	 * Enables dynamic items grouping based on the dimensions of the toolbar.
	 *
	 * @param view An instance of the toolbar that this behavior is added to.
	 */ render(view) {
        this.viewElement = view.element;
        this._enableGroupingOnResize();
        this._enableGroupingOnMaxWidthChange(view);
    }
    /**
	 * Cleans up the internals used by this behavior.
	 */ destroy() {
        // The dropdown may not be in ToolbarView#children at the moment of toolbar destruction
        // so let's make sure it's actually destroyed along with the toolbar.
        this.groupedItemsDropdown.destroy();
        this.resizeObserver.destroy();
    }
    /**
	 * When called, it will check if any of the {@link #ungroupedItems} do not fit into a single row of the toolbar,
	 * and it will move them to the {@link #groupedItems} when it happens.
	 *
	 * At the same time, it will also check if there is enough space in the toolbar for the first of the
	 * {@link #groupedItems} to be returned back to {@link #ungroupedItems} and still fit into a single row
	 * without the toolbar wrapping.
	 */ _updateGrouping() {
        // Do no grouping–related geometry analysis when the toolbar is detached from visible DOM,
        // for instance before #render(), or after render but without a parent or a parent detached
        // from DOM. DOMRects won't work anyway and there will be tons of warning in the console and
        // nothing else. This happens, for instance, when the toolbar is detached from DOM and
        // some logic adds or removes its #items.
        if (!this.viewElement.ownerDocument.body.contains(this.viewElement)) {
            return;
        }
        // Do not update grouping when the element is invisible. Such toolbar has DOMRect filled with zeros
        // and that would cause all items to be grouped. Instead, queue the grouping so it runs next time
        // the toolbar is visible (the next ResizeObserver callback execution). This is handy because
        // the grouping could be caused by increasing the #maxWidth when the toolbar was invisible and the next
        // time it shows up, some items could actually be ungrouped (https://github.com/ckeditor/ckeditor5/issues/6575).
        if (!isVisible(this.viewElement)) {
            this.shouldUpdateGroupingOnNextResize = true;
            return;
        }
        // Remember how many items were initially grouped so at the it is possible to figure out if the number
        // of grouped items has changed. If the number has changed, geometry of the toolbar has also changed.
        const initialGroupedItemsCount = this.groupedItems.length;
        let wereItemsGrouped;
        // Group #items as long as some wrap to the next row. This will happen, for instance,
        // when the toolbar is getting narrow and there is not enough space to display all items in
        // a single row.
        while(this._areItemsOverflowing){
            this._groupLastItem();
            wereItemsGrouped = true;
        }
        // If none were grouped now but there were some items already grouped before,
        // then, what the hell, maybe let's see if some of them can be ungrouped. This happens when,
        // for instance, the toolbar is stretching and there's more space in it than before.
        if (!wereItemsGrouped && this.groupedItems.length) {
            // Ungroup items as long as none are overflowing or there are none to ungroup left.
            while(this.groupedItems.length && !this._areItemsOverflowing){
                this._ungroupFirstItem();
            }
            // If the ungrouping ended up with some item wrapping to the next row,
            // put it back to the group toolbar ("undo the last ungroup"). We don't know whether
            // an item will wrap or not until we ungroup it (that's a DOM/CSS thing) so this
            // clean–up is vital for the algorithm.
            if (this._areItemsOverflowing) {
                this._groupLastItem();
            }
        }
        if (this.groupedItems.length !== initialGroupedItemsCount) {
            this.view.fire('groupedItemsUpdate');
        }
    }
    /**
	 * Returns `true` when {@link module:ui/toolbar/toolbarview~ToolbarView#element} children visually overflow,
	 * for instance if the toolbar is narrower than its members. Returns `false` otherwise.
	 */ get _areItemsOverflowing() {
        // An empty toolbar cannot overflow.
        if (!this.ungroupedItems.length) {
            return false;
        }
        const element = this.viewElement;
        const uiLanguageDirection = this.viewLocale.uiLanguageDirection;
        const lastChildRect = new Rect(element.lastChild);
        const toolbarRect = new Rect(element);
        if (!this.cachedPadding) {
            const computedStyle = global.window.getComputedStyle(element);
            const paddingProperty = uiLanguageDirection === 'ltr' ? 'paddingRight' : 'paddingLeft';
            // parseInt() is essential because of quirky floating point numbers logic and DOM.
            // If the padding turned out too big because of that, the grouped items dropdown would
            // always look (from the Rect perspective) like it overflows (while it's not).
            this.cachedPadding = Number.parseInt(computedStyle[paddingProperty]);
        }
        if (uiLanguageDirection === 'ltr') {
            return lastChildRect.right > toolbarRect.right - this.cachedPadding;
        } else {
            return lastChildRect.left < toolbarRect.left + this.cachedPadding;
        }
    }
    /**
	 * Enables the functionality that prevents {@link #ungroupedItems} from overflowing (wrapping to the next row)
	 * upon resize when there is little space available. Instead, the toolbar items are moved to the
	 * {@link #groupedItems} collection and displayed in a dropdown at the end of the row (which has its own nested toolbar).
	 *
	 * When called, the toolbar will automatically analyze the location of its {@link #ungroupedItems} and "group"
	 * them in the dropdown if necessary. It will also observe the browser window for size changes in
	 * the future and respond to them by grouping more items or reverting already grouped back, depending
	 * on the visual space available.
	 */ _enableGroupingOnResize() {
        let previousWidth;
        // TODO: Consider debounce.
        this.resizeObserver = new ResizeObserver(this.viewElement, (entry)=>{
            if (!previousWidth || previousWidth !== entry.contentRect.width || this.shouldUpdateGroupingOnNextResize) {
                this.shouldUpdateGroupingOnNextResize = false;
                this._updateGrouping();
                previousWidth = entry.contentRect.width;
            }
        });
        this._updateGrouping();
    }
    /**
	 * Enables the grouping functionality, just like {@link #_enableGroupingOnResize} but the difference is that
	 * it listens to the changes of {@link module:ui/toolbar/toolbarview~ToolbarView#maxWidth} instead.
	 */ _enableGroupingOnMaxWidthChange(view) {
        view.on('change:maxWidth', ()=>{
            this._updateGrouping();
        });
    }
    /**
	 * When called, it will remove the last item from {@link #ungroupedItems} and move it back
	 * to the {@link #groupedItems} collection.
	 *
	 * The opposite of {@link #_ungroupFirstItem}.
	 */ _groupLastItem() {
        if (!this.groupedItems.length) {
            this.viewChildren.add(new ToolbarSeparatorView());
            this.viewChildren.add(this.groupedItemsDropdown);
            this.viewFocusTracker.add(this.groupedItemsDropdown.element);
        }
        this.groupedItems.add(this.ungroupedItems.remove(this.ungroupedItems.last), 0);
    }
    /**
	 * Moves the very first item belonging to {@link #groupedItems} back
	 * to the {@link #ungroupedItems} collection.
	 *
	 * The opposite of {@link #_groupLastItem}.
	 */ _ungroupFirstItem() {
        this.ungroupedItems.add(this.groupedItems.remove(this.groupedItems.first));
        if (!this.groupedItems.length) {
            this.viewChildren.remove(this.groupedItemsDropdown);
            this.viewChildren.remove(this.viewChildren.last);
            this.viewFocusTracker.remove(this.groupedItemsDropdown.element);
        }
    }
    /**
	 * Creates the {@link #groupedItemsDropdown} that hosts the members of the {@link #groupedItems}
	 * collection when there is not enough space in the toolbar to display all items in a single row.
	 */ _createGroupedItemsDropdown() {
        const locale = this.viewLocale;
        const t = locale.t;
        const dropdown = createDropdown(locale);
        dropdown.class = 'ck-toolbar__grouped-dropdown';
        // Make sure the dropdown never sticks out to the left/right. It should be under the main toolbar.
        // (https://github.com/ckeditor/ckeditor5/issues/5608)
        dropdown.panelPosition = locale.uiLanguageDirection === 'ltr' ? 'sw' : 'se';
        addToolbarToDropdown(dropdown, this.groupedItems);
        dropdown.buttonView.set({
            label: t('Show more items'),
            tooltip: true,
            tooltipPosition: locale.uiLanguageDirection === 'rtl' ? 'se' : 'sw',
            icon: icons.threeVerticalDots
        });
        return dropdown;
    }
    /**
	 * Updates the {@link module:ui/toolbar/toolbarview~ToolbarView#focusables focus–cyclable items}
	 * collection so it represents the up–to–date state of the UI from the perspective of the user.
	 *
	 * For instance, the {@link #groupedItemsDropdown} can show up and hide but when it is visible,
	 * it must be subject to focus cycling in the toolbar.
	 *
	 * See the {@link module:ui/toolbar/toolbarview~ToolbarView#focusables collection} documentation
	 * to learn more about the purpose of this method.
	 */ _updateFocusCyclableItems() {
        this.viewFocusables.clear();
        this.ungroupedItems.map((item)=>{
            if (isFocusable(item)) {
                this.viewFocusables.add(item);
            }
        });
        if (this.groupedItems.length) {
            this.viewFocusables.add(this.groupedItemsDropdown);
        }
    }
}

/**
 * The list item view class.
 */ class ListItemView extends View {
    /**
	 * Collection of the child views inside of the list item {@link #element}.
	 */ children;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isVisible', true);
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'li',
            attributes: {
                class: [
                    'ck',
                    'ck-list__item',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ],
                role: 'presentation'
            },
            children: this.children
        });
    }
    /**
	 * Focuses the list item.
	 */ focus() {
        if (this.children.first) {
            this.children.first.focus();
        }
    }
}

/**
 * The list separator view class.
 */ class ListSeparatorView extends View {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.setTemplate({
            tag: 'li',
            attributes: {
                class: [
                    'ck',
                    'ck-list__separator'
                ]
            }
        });
    }
}

/**
 * The list item group view class.
 */ class ListItemGroupView extends View {
    /**
	 * Label of the group view. Its text is configurable using the {@link #label label attribute}.
	 *
	 * If a custom label view is not passed in `ListItemGroupView` constructor, the label is an instance
	 * of {@link module:ui/label/labelview~LabelView}.
	 */ labelView;
    /**
	 * Collection of the child list items inside this group.
	 */ items;
    /**
	 * Collection of the child elements of the group.
	 */ children;
    /**
	 * Creates an instance of the list item group view class.
	 *
	 * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
	 * @param labelView The instance of the group's label. If not provided, an instance of
	 * {@link module:ui/label/labelview~LabelView} is used.
	 */ constructor(locale, labelView = new LabelView()){
        super(locale);
        const bind = this.bindTemplate;
        const nestedList = new ListView(locale);
        this.set({
            label: '',
            isVisible: true
        });
        this.labelView = labelView;
        this.labelView.bind('text').to(this, 'label');
        this.children = this.createCollection();
        this.children.addMany([
            this.labelView,
            nestedList
        ]);
        nestedList.set({
            role: 'group',
            ariaLabelledBy: labelView.id
        });
        // Disable focus tracking and accessible navigation in the child list.
        nestedList.focusTracker.destroy();
        nestedList.keystrokes.destroy();
        this.items = nestedList.items;
        this.setTemplate({
            tag: 'li',
            attributes: {
                role: 'presentation',
                class: [
                    'ck',
                    'ck-list__group',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ]
            },
            children: this.children
        });
    }
    /**
	 * Focuses the list item (which is not a separator).
	 */ focus() {
        if (this.items) {
            const firstListItem = this.items.find((item)=>!(item instanceof ListSeparatorView));
            if (firstListItem) {
                firstListItem.focus();
            }
        }
    }
}

/**
 * The list view class.
 */ class ListView extends View {
    /**
	 * The collection of focusable views in the list. It is used to determine accessible navigation
	 * between the {@link module:ui/list/listitemview~ListItemView list items} and
	 * {@link module:ui/list/listitemgroupview~ListItemGroupView list groups}.
	 */ focusables;
    /**
	 * Collection of the child list views.
	 */ items;
    /**
	 * Tracks information about DOM focus in the list.
	 */ focusTracker;
    /**
	 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes;
    /**
	 * Helps cycling over focusable {@link #items} in the list.
	 */ _focusCycler;
    /**
	 * A cached map of {@link module:ui/list/listitemgroupview~ListItemGroupView} to `change` event listeners for their `items`.
	 * Used for accessibility and keyboard navigation purposes.
	 */ _listItemGroupToChangeListeners = new WeakMap();
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.focusables = new ViewCollection();
        this.items = this.createCollection();
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this._focusCycler = new FocusCycler({
            focusables: this.focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate list items backwards using the arrowup key.
                focusPrevious: 'arrowup',
                // Navigate toolbar items forwards using the arrowdown key.
                focusNext: 'arrowdown'
            }
        });
        this.set('ariaLabel', undefined);
        this.set('ariaLabelledBy', undefined);
        this.set('role', undefined);
        this.setTemplate({
            tag: 'ul',
            attributes: {
                class: [
                    'ck',
                    'ck-reset',
                    'ck-list'
                ],
                role: bind.to('role'),
                'aria-label': bind.to('ariaLabel'),
                'aria-labelledby': bind.to('ariaLabelledBy')
            },
            children: this.items
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        // Items added before rendering should be known to the #focusTracker.
        for (const item of this.items){
            if (item instanceof ListItemGroupView) {
                this._registerFocusableItemsGroup(item);
            } else if (item instanceof ListItemView) {
                this._registerFocusableListItem(item);
            }
        }
        this.items.on('change', (evt, data)=>{
            for (const removed of data.removed){
                if (removed instanceof ListItemGroupView) {
                    this._deregisterFocusableItemsGroup(removed);
                } else if (removed instanceof ListItemView) {
                    this._deregisterFocusableListItem(removed);
                }
            }
            for (const added of Array.from(data.added).reverse()){
                if (added instanceof ListItemGroupView) {
                    this._registerFocusableItemsGroup(added, data.index);
                } else {
                    this._registerFocusableListItem(added, data.index);
                }
            }
        });
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
    /**
	 * Focuses the first focusable in {@link #items}.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the first focusable in {@link #items}.
	 */ focusFirst() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the last focusable in {@link #items}.
	 */ focusLast() {
        this._focusCycler.focusLast();
    }
    /**
	 * Registers a list item view in the focus tracker.
	 *
	 * @param item The list item view to be registered.
	 * @param index Index of the list item view in the {@link #items} collection. If not specified, the item will be added at the end.
	 */ _registerFocusableListItem(item, index) {
        this.focusTracker.add(item.element);
        this.focusables.add(item, index);
    }
    /**
	 * Removes a list item view from the focus tracker.
	 *
	 * @param item The list item view to be removed.
	 */ _deregisterFocusableListItem(item) {
        this.focusTracker.remove(item.element);
        this.focusables.remove(item);
    }
    /**
	 * Gets a callback that will be called when the `items` collection of a {@link module:ui/list/listitemgroupview~ListItemGroupView}
	 * change.
	 *
	 * @param groupView The group view for which the callback will be created.
	 * @returns The callback function to be used for the items `change` event listener in a group.
	 */ _getOnGroupItemsChangeCallback(groupView) {
        return (evt, data)=>{
            for (const removed of data.removed){
                this._deregisterFocusableListItem(removed);
            }
            for (const added of Array.from(data.added).reverse()){
                this._registerFocusableListItem(added, this.items.getIndex(groupView) + data.index);
            }
        };
    }
    /**
	 * Registers a list item group view (and its children) in the focus tracker.
	 *
	 * @param groupView A group view to be registered.
	 * @param groupIndex Index of the group view in the {@link #items} collection. If not specified, the group will be added at the end.
	 */ _registerFocusableItemsGroup(groupView, groupIndex) {
        Array.from(groupView.items).forEach((child, childIndex)=>{
            const registeredChildIndex = typeof groupIndex !== 'undefined' ? groupIndex + childIndex : undefined;
            this._registerFocusableListItem(child, registeredChildIndex);
        });
        const groupItemsChangeCallback = this._getOnGroupItemsChangeCallback(groupView);
        // Cache the reference to the callback in case the group is removed (see _deregisterFocusableItemsGroup()).
        this._listItemGroupToChangeListeners.set(groupView, groupItemsChangeCallback);
        groupView.items.on('change', groupItemsChangeCallback);
    }
    /**
	 * Removes a list item group view (and its children) from the focus tracker.
	 *
	 * @param groupView The group view to be removed.
	 */ _deregisterFocusableItemsGroup(groupView) {
        for (const child of groupView.items){
            this._deregisterFocusableListItem(child);
        }
        groupView.items.off('change', this._listItemGroupToChangeListeners.get(groupView));
        this._listItemGroupToChangeListeners.delete(groupView);
    }
}

/**
 * The split button view class.
 *
 * ```ts
 * const view = new SplitButtonView();
 *
 * view.set( {
 * 	label: 'A button',
 * 	keystroke: 'Ctrl+B',
 * 	tooltip: true
 * } );
 *
 * view.render();
 *
 * document.body.append( view.element );
 * ```
 *
 * Also see the {@link module:ui/dropdown/utils~createDropdown `createDropdown()` util}.
 */ class SplitButtonView extends View {
    /**
	 * Collection of the child views inside of the split button {@link #element}.
	 */ children;
    /**
	 * A main button of split button.
	 */ actionView;
    /**
	 * A secondary button of split button that opens dropdown.
	 */ arrowView;
    /**
	 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}. It manages
	 * keystrokes of the split button:
	 *
	 * * <kbd>▶</kbd> moves focus to arrow view when action view is focused,
	 * * <kbd>◀</kbd> moves focus to action view when arrow view is focused.
	 */ keystrokes;
    /**
	 * Tracks information about DOM focus in the dropdown.
	 */ focusTracker;
    /**
	 * @inheritDoc
	 */ constructor(locale, actionButton){
        super(locale);
        const bind = this.bindTemplate;
        // Implement the Button interface.
        this.set('class', undefined);
        this.set('labelStyle', undefined);
        this.set('icon', undefined);
        this.set('isEnabled', true);
        this.set('isOn', false);
        this.set('isToggleable', false);
        this.set('isVisible', true);
        this.set('keystroke', undefined);
        this.set('withKeystroke', false);
        this.set('label', undefined);
        this.set('tabindex', -1);
        this.set('tooltip', false);
        this.set('tooltipPosition', 's');
        this.set('type', 'button');
        this.set('withText', false);
        this.children = this.createCollection();
        this.actionView = this._createActionView(actionButton);
        this.arrowView = this._createArrowView();
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-splitbutton',
                    bind.to('class'),
                    bind.if('isVisible', 'ck-hidden', (value)=>!value),
                    this.arrowView.bindTemplate.if('isOn', 'ck-splitbutton_open')
                ]
            },
            children: this.children
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.add(this.actionView);
        this.children.add(this.arrowView);
        this.focusTracker.add(this.actionView.element);
        this.focusTracker.add(this.arrowView.element);
        this.keystrokes.listenTo(this.element);
        // Overrides toolbar focus cycling behavior.
        this.keystrokes.set('arrowright', (evt, cancel)=>{
            if (this.focusTracker.focusedElement === this.actionView.element) {
                this.arrowView.focus();
                cancel();
            }
        });
        // Overrides toolbar focus cycling behavior.
        this.keystrokes.set('arrowleft', (evt, cancel)=>{
            if (this.focusTracker.focusedElement === this.arrowView.element) {
                this.actionView.focus();
                cancel();
            }
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
    /**
	 * Focuses the {@link module:ui/button/buttonview~ButtonView#element} of the action part of split button.
	 */ focus() {
        this.actionView.focus();
    }
    /**
	 * Creates a {@link module:ui/button/buttonview~ButtonView} instance as {@link #actionView} and binds it with main split button
	 * attributes.
	 */ _createActionView(actionButton) {
        const actionView = actionButton || new ButtonView();
        if (!actionButton) {
            actionView.bind('icon', 'isEnabled', 'isOn', 'isToggleable', 'keystroke', 'label', 'tabindex', 'tooltip', 'tooltipPosition', 'type', 'withText').to(this);
        }
        actionView.extendTemplate({
            attributes: {
                class: 'ck-splitbutton__action'
            }
        });
        actionView.delegate('execute').to(this);
        return actionView;
    }
    /**
	 * Creates a {@link module:ui/button/buttonview~ButtonView} instance as {@link #arrowView} and binds it with main split button
	 * attributes.
	 */ _createArrowView() {
        const arrowView = new ButtonView();
        const bind = arrowView.bindTemplate;
        arrowView.icon = dropdownArrowIcon;
        arrowView.extendTemplate({
            attributes: {
                class: [
                    'ck-splitbutton__arrow'
                ],
                'data-cke-tooltip-disabled': bind.to('isOn'),
                'aria-haspopup': true,
                'aria-expanded': bind.to('isOn', (value)=>String(value))
            }
        });
        arrowView.bind('isEnabled').to(this);
        arrowView.bind('label').to(this);
        arrowView.bind('tooltip').to(this);
        arrowView.delegate('execute').to(this, 'open');
        return arrowView;
    }
}

/**
 * A helper for creating dropdowns. It creates an instance of a {@link module:ui/dropdown/dropdownview~DropdownView dropdown},
 * with a {@link module:ui/dropdown/button/dropdownbutton~DropdownButton button},
 * {@link module:ui/dropdown/dropdownpanelview~DropdownPanelView panel} and all standard dropdown's behaviors.
 *
 * # Creating dropdowns
 *
 * By default, the default {@link module:ui/dropdown/button/dropdownbuttonview~DropdownButtonView} class is used as
 * definition of the button:
 *
 * ```ts
 * const dropdown = createDropdown( model );
 *
 * // Configure dropdown's button properties:
 * dropdown.buttonView.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.render();
 *
 * // Will render a dropdown labeled "A dropdown" with an empty panel.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * You can also provide other button views (they need to implement the
 * {@link module:ui/dropdown/button/dropdownbutton~DropdownButton} interface). For instance, you can use
 * {@link module:ui/dropdown/button/splitbuttonview~SplitButtonView} to create a dropdown with a split button.
 *
 * ```ts
 * const dropdown = createDropdown( locale, SplitButtonView );
 *
 * // Configure dropdown's button properties:
 * dropdown.buttonView.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.buttonView.on( 'execute', () => {
 * 	// Add the behavior of the "action part" of the split button.
 * 	// Split button consists of the "action part" and "arrow part".
 * 	// The arrow opens the dropdown while the action part can have some other behavior.
 * } );
 *
 * dropdown.render();
 *
 * // Will render a dropdown labeled "A dropdown" with an empty panel.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * # Adding content to the dropdown's panel
 *
 * The content of the panel can be inserted directly into the `dropdown.panelView.element`:
 *
 * ```ts
 * dropdown.panelView.element.textContent = 'Content of the panel';
 * ```
 *
 * However, most of the time you will want to add there either a {@link module:ui/list/listview~ListView list of options}
 * or a list of buttons (i.e. a {@link module:ui/toolbar/toolbarview~ToolbarView toolbar}).
 * To simplify the task, you can use, respectively, {@link module:ui/dropdown/utils~addListToDropdown} or
 * {@link module:ui/dropdown/utils~addToolbarToDropdown} utils.
 *
 * @param locale The locale instance.
 * @param ButtonClassOrInstance The dropdown button view class. Needs to implement the
 * {@link module:ui/dropdown/button/dropdownbutton~DropdownButton} interface.
 * @returns The dropdown view instance.
 */ function createDropdown(locale, ButtonClassOrInstance = DropdownButtonView) {
    const buttonView = typeof ButtonClassOrInstance == 'function' ? new ButtonClassOrInstance(locale) : ButtonClassOrInstance;
    const panelView = new DropdownPanelView(locale);
    const dropdownView = new DropdownView(locale, buttonView, panelView);
    buttonView.bind('isEnabled').to(dropdownView);
    if (buttonView instanceof SplitButtonView) {
        buttonView.arrowView.bind('isOn').to(dropdownView, 'isOpen');
    } else {
        buttonView.bind('isOn').to(dropdownView, 'isOpen');
    }
    addDefaultBehavior(dropdownView);
    return dropdownView;
}
/**
 * Adds an instance of {@link module:ui/toolbar/toolbarview~ToolbarView} to a dropdown.
 *
 * ```ts
 * const buttonsCreator = () => {
 * 	const buttons = [];
 *
 * 	// Either create a new ButtonView instance or create existing.
 * 	buttons.push( new ButtonView() );
 * 	buttons.push( editor.ui.componentFactory.create( 'someButton' ) );
 * };
 *
 * const dropdown = createDropdown( locale );
 *
 * addToolbarToDropdown( dropdown, buttonsCreator, { isVertical: true } );
 *
 * // Will render a vertical button dropdown labeled "A button dropdown"
 * // with a button group in the panel containing two buttons.
 * // Buttons inside the dropdown will be created on first dropdown panel open.
 * dropdown.render()
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * **Note:** To improve the accessibility, you can tell the dropdown to focus the first active button of the toolbar when the dropdown
 * {@link module:ui/dropdown/dropdownview~DropdownView#isOpen gets open}. See the documentation of `options` to learn more.
 *
 * **Note:** Toolbar view will be created on first open of the dropdown.
 *
 * See {@link module:ui/dropdown/utils~createDropdown} and {@link module:ui/toolbar/toolbarview~ToolbarView}.
 *
 * @param dropdownView A dropdown instance to which `ToolbarView` will be added.
 * @param options.enableActiveItemFocusOnDropdownOpen When set `true`, the focus will automatically move to the first
 * active {@link module:ui/toolbar/toolbarview~ToolbarView#items item} of the toolbar upon
 * {@link module:ui/dropdown/dropdownview~DropdownView#isOpen opening} the dropdown. Active items are those with the `isOn` property set
 * `true` (for instance {@link module:ui/button/buttonview~ButtonView buttons}). If no active items is found, the toolbar will be focused
 * as a whole resulting in the focus moving to its first focusable item (default behavior of
 * {@link module:ui/dropdown/dropdownview~DropdownView}).
 * @param options.ariaLabel Label used by assistive technologies to describe toolbar element.
 * @param options.maxWidth The maximum width of the toolbar element.
 * Details: {@link module:ui/toolbar/toolbarview~ToolbarView#maxWidth}.
 * @param options.class An additional CSS class added to the toolbar element.
 * @param options.isCompact When set true, makes the toolbar look compact with toolbar element.
 * @param options.isVertical Controls the orientation of toolbar items.
 */ function addToolbarToDropdown(dropdownView, buttonsOrCallback, options = {}) {
    dropdownView.extendTemplate({
        attributes: {
            class: [
                'ck-toolbar-dropdown'
            ]
        }
    });
    if (dropdownView.isOpen) {
        addToolbarToOpenDropdown(dropdownView, buttonsOrCallback, options);
    } else {
        dropdownView.once('change:isOpen', ()=>addToolbarToOpenDropdown(dropdownView, buttonsOrCallback, options), {
            priority: 'highest'
        });
    }
    if (options.enableActiveItemFocusOnDropdownOpen) {
        // Accessibility: Focus the first active button in the toolbar when the dropdown gets open.
        focusChildOnDropdownOpen(dropdownView, ()=>dropdownView.toolbarView.items.find((item)=>item.isOn));
    }
}
/**
 * Adds an instance of {@link module:ui/toolbar/toolbarview~ToolbarView} to a dropdown.
 */ function addToolbarToOpenDropdown(dropdownView, buttonsOrCallback, options) {
    const locale = dropdownView.locale;
    const t = locale.t;
    const toolbarView = dropdownView.toolbarView = new ToolbarView(locale);
    const buttons = typeof buttonsOrCallback == 'function' ? buttonsOrCallback() : buttonsOrCallback;
    toolbarView.ariaLabel = options.ariaLabel || t('Dropdown toolbar');
    if (options.maxWidth) {
        toolbarView.maxWidth = options.maxWidth;
    }
    if (options.class) {
        toolbarView.class = options.class;
    }
    if (options.isCompact) {
        toolbarView.isCompact = options.isCompact;
    }
    if (options.isVertical) {
        toolbarView.isVertical = true;
    }
    if (buttons instanceof ViewCollection) {
        toolbarView.items.bindTo(buttons).using((item)=>item);
    } else {
        toolbarView.items.addMany(buttons);
    }
    dropdownView.panelView.children.add(toolbarView);
    toolbarView.items.delegate('execute').to(dropdownView);
}
/**
 * Adds an instance of {@link module:ui/list/listview~ListView} to a dropdown.
 *
 * ```ts
 * const items = new Collection<ListDropdownItemDefinition>();
 *
 * items.add( {
 * 	type: 'button',
 * 	model: new Model( {
 * 		withText: true,
 * 		label: 'First item',
 * 		labelStyle: 'color: red'
 * 	} )
 * } );
 *
 * items.add( {
 * 	 type: 'button',
 * 	 model: new Model( {
 * 		withText: true,
 * 		label: 'Second item',
 * 		labelStyle: 'color: green',
 * 		class: 'foo'
 * 	} )
 * } );
 *
 * const dropdown = createDropdown( locale );
 *
 * addListToDropdown( dropdown, items );
 *
 * // Will render a dropdown with a list in the panel containing two items.
 * dropdown.render()
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * The `items` collection passed to this methods controls the presence and attributes of respective
 * {@link module:ui/list/listitemview~ListItemView list items}.
 *
 * **Note:** To improve the accessibility, when a list is added to the dropdown using this helper the dropdown will automatically attempt
 * to focus the first active item (a host to a {@link module:ui/button/buttonview~ButtonView} with
 * {@link module:ui/button/buttonview~ButtonView#isOn} set `true`) or the very first item when none are active.
 *
 * **Note:** List view will be created on first open of the dropdown.
 *
 * See {@link module:ui/dropdown/utils~createDropdown} and {@link module:list/list~List}.
 *
 * @param dropdownView A dropdown instance to which `ListVIew` will be added.
 * @param itemsOrCallback A collection of the list item definitions or a callback returning a list item definitions to populate the list.
 * @param options.ariaLabel Label used by assistive technologies to describe list element.
 * @param options.role Will be reflected by the `role` DOM attribute in `ListVIew` and used by assistive technologies.
 */ function addListToDropdown(dropdownView, itemsOrCallback, options = {}) {
    if (dropdownView.isOpen) {
        addListToOpenDropdown(dropdownView, itemsOrCallback, options);
    } else {
        dropdownView.once('change:isOpen', ()=>addListToOpenDropdown(dropdownView, itemsOrCallback, options), {
            priority: 'highest'
        });
    }
    // Accessibility: Focus the first active button in the list when the dropdown gets open.
    focusChildOnDropdownOpen(dropdownView, ()=>dropdownView.listView.items.find((item)=>{
            if (item instanceof ListItemView) {
                return item.children.first.isOn;
            }
            return false;
        }));
}
/**
 * Adds an instance of {@link module:ui/list/listview~ListView} to a dropdown.
 */ function addListToOpenDropdown(dropdownView, itemsOrCallback, options) {
    const locale = dropdownView.locale;
    const listView = dropdownView.listView = new ListView(locale);
    const items = typeof itemsOrCallback == 'function' ? itemsOrCallback() : itemsOrCallback;
    listView.ariaLabel = options.ariaLabel;
    listView.role = options.role;
    bindViewCollectionItemsToDefinitions(dropdownView, listView.items, items, locale);
    dropdownView.panelView.children.add(listView);
    listView.items.delegate('execute').to(dropdownView);
}
/**
 * A helper to be used on an existing {@link module:ui/dropdown/dropdownview~DropdownView} that focuses
 * a specific child in DOM when the dropdown {@link module:ui/dropdown/dropdownview~DropdownView#isOpen gets open}.
 *
 * @param dropdownView A dropdown instance to which the focus behavior will be added.
 * @param childSelectorCallback A callback executed when the dropdown gets open. It should return a {@link module:ui/view~View}
 * instance (child of {@link module:ui/dropdown/dropdownview~DropdownView#panelView}) that will get focused or a falsy value.
 * If falsy value is returned, a default behavior of the dropdown will engage focusing the first focusable child in
 * the {@link module:ui/dropdown/dropdownview~DropdownView#panelView}.
 */ function focusChildOnDropdownOpen(dropdownView, childSelectorCallback) {
    dropdownView.on('change:isOpen', ()=>{
        if (!dropdownView.isOpen) {
            return;
        }
        const childToFocus = childSelectorCallback();
        if (!childToFocus) {
            return;
        }
        if (typeof childToFocus.focus === 'function') {
            childToFocus.focus();
        } else {
            /**
			 * The child view of a {@link module:ui/dropdown/dropdownview~DropdownView dropdown} is missing the `focus()` method
			 * and could not be focused when the dropdown got {@link module:ui/dropdown/dropdownview~DropdownView#isOpen open}.
			 *
			 * Making the content of a dropdown focusable in this case greatly improves the accessibility. Please make the view instance
			 * implements the {@link module:ui/dropdown/dropdownpanelfocusable~DropdownPanelFocusable focusable interface} for the best user
			 * experience.
			 *
			 * @error ui-dropdown-focus-child-on-open-child-missing-focus
			 * @param {module:ui/view~View} view
			 */ logWarning('ui-dropdown-focus-child-on-open-child-missing-focus', {
                view: childToFocus
            });
        }
    // * Let the panel show up first (do not focus an invisible element).
    // * Execute after focusDropdownPanelOnOpen(). See focusDropdownPanelOnOpen() to learn more.
    }, {
        priority: priorities.low - 10
    });
}
/**
 * Add a set of default behaviors to dropdown view.
 */ function addDefaultBehavior(dropdownView) {
    closeDropdownOnClickOutside(dropdownView);
    closeDropdownOnExecute(dropdownView);
    closeDropdownOnBlur(dropdownView);
    focusDropdownContentsOnArrows(dropdownView);
    focusDropdownButtonOnClose(dropdownView);
    focusDropdownPanelOnOpen(dropdownView);
}
/**
 * Adds a behavior to a dropdownView that closes opened dropdown when user clicks outside the dropdown.
 */ function closeDropdownOnClickOutside(dropdownView) {
    dropdownView.on('render', ()=>{
        clickOutsideHandler({
            emitter: dropdownView,
            activator: ()=>dropdownView.isOpen,
            callback: ()=>{
                dropdownView.isOpen = false;
            },
            contextElements: ()=>[
                    dropdownView.element,
                    ...dropdownView.focusTracker._elements
                ]
        });
    });
}
/**
 * Adds a behavior to a dropdownView that closes the dropdown view on "execute" event.
 */ function closeDropdownOnExecute(dropdownView) {
    // Close the dropdown when one of the list items has been executed.
    dropdownView.on('execute', (evt)=>{
        // Toggling a switch button view should not close the dropdown.
        if (evt.source instanceof SwitchButtonView) {
            return;
        }
        dropdownView.isOpen = false;
    });
}
/**
 * Adds a behavior to a dropdown view that closes opened dropdown when it loses focus.
 */ function closeDropdownOnBlur(dropdownView) {
    dropdownView.focusTracker.on('change:isFocused', (evt, name, isFocused)=>{
        if (dropdownView.isOpen && !isFocused) {
            dropdownView.isOpen = false;
        }
    });
}
/**
 * Adds a behavior to a dropdownView that focuses the dropdown's panel view contents on keystrokes.
 */ function focusDropdownContentsOnArrows(dropdownView) {
    // If the dropdown panel is already open, the arrow down key should focus the first child of the #panelView.
    dropdownView.keystrokes.set('arrowdown', (data, cancel)=>{
        if (dropdownView.isOpen) {
            dropdownView.panelView.focus();
            cancel();
        }
    });
    // If the dropdown panel is already open, the arrow up key should focus the last child of the #panelView.
    dropdownView.keystrokes.set('arrowup', (data, cancel)=>{
        if (dropdownView.isOpen) {
            dropdownView.panelView.focusLast();
            cancel();
        }
    });
}
/**
 * Adds a behavior that focuses the #buttonView when the dropdown was closed but focus was within the #panelView element.
 * This makes sure the focus is never lost.
 */ function focusDropdownButtonOnClose(dropdownView) {
    dropdownView.on('change:isOpen', (evt, name, isOpen)=>{
        if (isOpen) {
            return;
        }
        const element = dropdownView.panelView.element;
        // If the dropdown was closed, move the focus back to the button (#12125).
        // Don't touch the focus, if it moved somewhere else (e.g. moved to the editing root on #execute) (#12178).
        // Note: Don't use the state of the DropdownView#focusTracker here. It fires #blur with the timeout.
        if (element && element.contains(global.document.activeElement)) {
            dropdownView.buttonView.focus();
        }
    });
}
/**
 * Adds a behavior that focuses the #panelView when dropdown gets open (accessibility).
 */ function focusDropdownPanelOnOpen(dropdownView) {
    dropdownView.on('change:isOpen', (evt, name, isOpen)=>{
        if (!isOpen) {
            return;
        }
        // Focus the first item in the dropdown when the dropdown opened.
        dropdownView.panelView.focus();
    // * Let the panel show up first (do not focus an invisible element).
    // * Also, execute before focusChildOnDropdownOpen() to make sure this helper does not break the
    //   focus of a specific child by kicking in too late and resetting the focus in the panel.
    }, {
        priority: 'low'
    });
}
/**
 * This helper populates a dropdown list with items and groups according to the
 * collection of item definitions. A permanent binding is created in this process allowing
 * dynamic management of the dropdown list content.
 *
 * @param dropdownView
 * @param listItems
 * @param definitions
 * @param locale
 */ function bindViewCollectionItemsToDefinitions(dropdownView, listItems, definitions, locale) {
    listItems.bindTo(definitions).using((def)=>{
        if (def.type === 'separator') {
            return new ListSeparatorView(locale);
        } else if (def.type === 'group') {
            const groupView = new ListItemGroupView(locale);
            groupView.set({
                label: def.label
            });
            bindViewCollectionItemsToDefinitions(dropdownView, groupView.items, def.items, locale);
            groupView.items.delegate('execute').to(dropdownView);
            return groupView;
        } else if (def.type === 'button' || def.type === 'switchbutton') {
            const listItemView = new ListItemView(locale);
            let buttonView;
            if (def.type === 'button') {
                buttonView = new ButtonView(locale);
                buttonView.bind('ariaChecked').to(buttonView, 'isOn');
            } else {
                buttonView = new SwitchButtonView(locale);
            }
            // Bind all model properties to the button view.
            buttonView.bind(...Object.keys(def.model)).to(def.model);
            buttonView.delegate('execute').to(listItemView);
            listItemView.children.add(buttonView);
            return listItemView;
        }
        return null;
    });
}

/**
 * A helper for creating labeled inputs.
 *
 * It creates an instance of a {@link module:ui/inputtext/inputtextview~InputTextView input text} that is
 * logically related to a {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView labeled view} in DOM.
 *
 * The helper does the following:
 *
 * * It sets input's `id` and `ariaDescribedById` attributes.
 * * It binds input's `isReadOnly` to the labeled view.
 * * It binds input's `hasError` to the labeled view.
 * * It enables a logic that cleans up the error when user starts typing in the input.
 *
 * Usage:
 *
 * ```ts
 * const labeledInputView = new LabeledFieldView( locale, createLabeledInputText );
 * console.log( labeledInputView.fieldView ); // A text input instance.
 * ```
 *
 * @param labeledFieldView The instance of the labeled field view.
 * @param viewUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#labelView labeled view's label} and the input.
 * @param statusUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#statusView labeled view's status} and the input.
 * @returns The input text view instance.
 */ const createLabeledInputText = (labeledFieldView, viewUid, statusUid)=>{
    const inputView = new InputTextView(labeledFieldView.locale);
    inputView.set({
        id: viewUid,
        ariaDescribedById: statusUid
    });
    inputView.bind('isReadOnly').to(labeledFieldView, 'isEnabled', (value)=>!value);
    inputView.bind('hasError').to(labeledFieldView, 'errorText', (value)=>!!value);
    inputView.on('input', ()=>{
        // UX: Make the error text disappear and disable the error indicator as the user
        // starts fixing the errors.
        labeledFieldView.errorText = null;
    });
    labeledFieldView.bind('isEmpty', 'isFocused', 'placeholder').to(inputView);
    return inputView;
};
/**
 * A helper for creating labeled number inputs.
 *
 * It creates an instance of a {@link module:ui/inputnumber/inputnumberview~InputNumberView input number} that is
 * logically related to a {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView labeled view} in DOM.
 *
 * The helper does the following:
 *
 * * It sets input's `id` and `ariaDescribedById` attributes.
 * * It binds input's `isReadOnly` to the labeled view.
 * * It binds input's `hasError` to the labeled view.
 * * It enables a logic that cleans up the error when user starts typing in the input.
 *
 * Usage:
 *
 * ```ts
 * const labeledInputView = new LabeledFieldView( locale, createLabeledInputNumber );
 * console.log( labeledInputView.fieldView ); // A number input instance.
 * ```
 *
 * @param labeledFieldView The instance of the labeled field view.
 * @param viewUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#labelView labeled view's label} and the input.
 * @param statusUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#statusView labeled view's status} and the input.
 * @returns The input number view instance.
 */ const createLabeledInputNumber = (labeledFieldView, viewUid, statusUid)=>{
    const inputView = new InputNumberView(labeledFieldView.locale);
    inputView.set({
        id: viewUid,
        ariaDescribedById: statusUid,
        inputMode: 'numeric'
    });
    inputView.bind('isReadOnly').to(labeledFieldView, 'isEnabled', (value)=>!value);
    inputView.bind('hasError').to(labeledFieldView, 'errorText', (value)=>!!value);
    inputView.on('input', ()=>{
        // UX: Make the error text disappear and disable the error indicator as the user
        // starts fixing the errors.
        labeledFieldView.errorText = null;
    });
    labeledFieldView.bind('isEmpty', 'isFocused', 'placeholder').to(inputView);
    return inputView;
};
/**
 * A helper for creating labeled textarea.
 *
 * It creates an instance of a {@link module:ui/textarea/textareaview~TextareaView textarea} that is
 * logically related to a {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView labeled view} in DOM.
 *
 * The helper does the following:
 *
 * * It sets textarea's `id` and `ariaDescribedById` attributes.
 * * It binds textarea's `isReadOnly` to the labeled view.
 * * It binds textarea's `hasError` to the labeled view.
 * * It enables a logic that cleans up the error when user starts typing in the textarea.
 *
 * Usage:
 *
 * ```ts
 * const labeledTextarea = new LabeledFieldView( locale, createLabeledTextarea );
 * console.log( labeledTextarea.fieldView ); // A textarea instance.
 * ```
 *
 * @param labeledFieldView The instance of the labeled field view.
 * @param viewUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#labelView labeled view's label} and the textarea.
 * @param statusUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#statusView labeled view's status} and the textarea.
 * @returns The textarea view instance.
 */ const createLabeledTextarea = (labeledFieldView, viewUid, statusUid)=>{
    const textareaView = new TextareaView(labeledFieldView.locale);
    textareaView.set({
        id: viewUid,
        ariaDescribedById: statusUid
    });
    textareaView.bind('isReadOnly').to(labeledFieldView, 'isEnabled', (value)=>!value);
    textareaView.bind('hasError').to(labeledFieldView, 'errorText', (value)=>!!value);
    textareaView.on('input', ()=>{
        // UX: Make the error text disappear and disable the error indicator as the user
        // starts fixing the errors.
        labeledFieldView.errorText = null;
    });
    labeledFieldView.bind('isEmpty', 'isFocused', 'placeholder').to(textareaView);
    return textareaView;
};
/**
 * A helper for creating labeled dropdowns.
 *
 * It creates an instance of a {@link module:ui/dropdown/dropdownview~DropdownView dropdown} that is
 * logically related to a {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView labeled field view}.
 *
 * The helper does the following:
 *
 * * It sets dropdown's `id` and `ariaDescribedById` attributes.
 * * It binds input's `isEnabled` to the labeled view.
 *
 * Usage:
 *
 * ```ts
 * const labeledInputView = new LabeledFieldView( locale, createLabeledDropdown );
 * console.log( labeledInputView.fieldView ); // A dropdown instance.
 * ```
 *
 * @param labeledFieldView The instance of the labeled field view.
 * @param viewUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#labelView labeled view label} and the dropdown.
 * @param statusUid A UID string that allows DOM logical connection between the
 * {@link module:ui/labeledfield/labeledfieldview~LabeledFieldView#statusView labeled view status} and the dropdown.
 * @returns The dropdown view instance.
 */ const createLabeledDropdown = (labeledFieldView, viewUid, statusUid)=>{
    const dropdownView = createDropdown(labeledFieldView.locale);
    dropdownView.set({
        id: viewUid,
        ariaDescribedById: statusUid
    });
    dropdownView.bind('isEnabled').to(labeledFieldView);
    return dropdownView;
};

const waitingTime = 150;
/**
 * A class which represents a color picker with an input field for defining custom colors.
 */ class ColorPickerView extends View {
    /**
	 * Container for a `#` sign prefix and an input for displaying and defining custom colors
	 * in HEX format.
	 */ hexInputRow;
    /**
	 * Debounced function updating the `color` property in the component
	 * and firing the `ColorPickerColorSelectedEvent`. Executed whenever color in component
	 * is changed by the user interaction (through the palette or input).
	 *
	 * @private
	 */ _debounceColorPickerEvent;
    /**
	 * A reference to the configuration of the color picker specified in the constructor.
	 *
	 * @private
	 */ _config;
    /**
	 * Creates a view of color picker.
	 *
	 * @param locale
	 * @param config
	 */ constructor(locale, config = {}){
        super(locale);
        this.set({
            color: '',
            _hexColor: ''
        });
        this.hexInputRow = this._createInputRow();
        const children = this.createCollection();
        if (!config.hideInput) {
            children.add(this.hexInputRow);
        }
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-color-picker'
                ],
                tabindex: -1
            },
            children
        });
        this._config = config;
        this._debounceColorPickerEvent = debounce((color)=>{
            // At first, set the color internally in the component. It's converted to the configured output format.
            this.set('color', color);
            // Then let the outside world know that the user changed the color.
            this.fire('colorSelected', {
                color: this.color
            });
        }, waitingTime, {
            leading: true
        });
        // The `color` property holds the color in the configured output format.
        // Ensure it before actually setting the value.
        this.on('set:color', (evt, propertyName, newValue)=>{
            evt.return = convertColor(newValue, this._config.format || 'hsl');
        });
        // The `_hexColor` property is bound to the `color` one, but requires conversion.
        this.on('change:color', ()=>{
            this._hexColor = convertColorToCommonHexFormat(this.color);
        });
        this.on('change:_hexColor', ()=>{
            // Update the selected color in the color picker palette when it's not focused.
            // It means the user typed the color in the input.
            if (document.activeElement !== this.picker) {
                this.picker.setAttribute('color', this._hexColor);
            }
            // There has to be two way binding between properties.
            // Extra precaution has to be taken to trigger change back only when the color really changes.
            if (convertColorToCommonHexFormat(this.color) != convertColorToCommonHexFormat(this._hexColor)) {
                this.color = this._hexColor;
            }
        });
    }
    /**
	 * Renders color picker in the view.
	 */ render() {
        super.render();
        // Extracted to the helper to make it testable.
        registerCustomElement('hex-color-picker', HexBase);
        this.picker = global.document.createElement('hex-color-picker');
        this.picker.setAttribute('class', 'hex-color-picker');
        this.picker.setAttribute('tabindex', '-1');
        this._createSlidersView();
        if (this.element) {
            if (this.hexInputRow.element) {
                this.element.insertBefore(this.picker, this.hexInputRow.element);
            } else {
                this.element.appendChild(this.picker);
            }
            // Create custom stylesheet with a look of focused pointer in color picker and append it into the color picker shadowDom
            const styleSheetForFocusedColorPicker = document.createElement('style');
            styleSheetForFocusedColorPicker.textContent = '[role="slider"]:focus [part$="pointer"] {' + 'border: 1px solid #fff;' + 'outline: 1px solid var(--ck-color-focus-border);' + 'box-shadow: 0 0 0 2px #fff;' + '}';
            this.picker.shadowRoot.appendChild(styleSheetForFocusedColorPicker);
        }
        this.picker.addEventListener('color-changed', (event)=>{
            const color = event.detail.value;
            this._debounceColorPickerEvent(color);
        });
    }
    /**
	 * Focuses the first pointer in color picker.
	 *
	 */ focus() {
        // In some browsers we need to move the focus to the input first.
        // Otherwise, the color picker doesn't behave as expected.
        // In FF, after selecting the color via slider, it instantly moves back to the previous color.
        // In all iOS browsers and desktop Safari, once the saturation slider is moved for the first time,
        // editor collapses the selection and doesn't apply the color change.
        // See: https://github.com/cksource/ckeditor5-internal/issues/3245, https://github.com/ckeditor/ckeditor5/issues/14119,
        // https://github.com/cksource/ckeditor5-internal/issues/3268.
        /* istanbul ignore next -- @preserve */ if (!this._config.hideInput && (env.isGecko || env.isiOS || env.isSafari)) {
            const input = this.hexInputRow.children.get(1);
            input.focus();
        }
        const firstSlider = this.slidersView.first;
        firstSlider.focus();
    }
    /**
	 * Creates collection of sliders in color picker.
	 *
	 * @private
	 */ _createSlidersView() {
        const colorPickersChildren = [
            ...this.picker.shadowRoot.children
        ];
        const sliders = colorPickersChildren.filter((item)=>item.getAttribute('role') === 'slider');
        const slidersView = sliders.map((slider)=>{
            const view = new SliderView(slider);
            return view;
        });
        this.slidersView = this.createCollection();
        slidersView.forEach((item)=>{
            this.slidersView.add(item);
        });
    }
    /**
	 * Creates input row for defining custom colors in color picker.
	 *
	 * @private
	 */ _createInputRow() {
        const colorInput = this._createColorInput();
        return new ColorPickerInputRowView(this.locale, colorInput);
    }
    /**
	 * Creates the input where user can type or paste the color in hex format.
	 *
	 * @private
	 */ _createColorInput() {
        const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
        const { t } = this.locale;
        labeledInput.set({
            label: t('HEX'),
            class: 'color-picker-hex-input'
        });
        labeledInput.fieldView.bind('value').to(this, '_hexColor', (pickerColor)=>{
            if (labeledInput.isFocused) {
                // Text field shouldn't be updated with color change if the text field is focused.
                // Imagine user typing hex code and getting the value of field changed.
                return labeledInput.fieldView.value;
            } else {
                return pickerColor.startsWith('#') ? pickerColor.substring(1) : pickerColor;
            }
        });
        // Only accept valid hex colors as input.
        labeledInput.fieldView.on('input', ()=>{
            const inputValue = labeledInput.fieldView.element.value;
            if (inputValue) {
                const maybeHexColor = tryParseHexColor(inputValue);
                if (maybeHexColor) {
                    // If so, set the color.
                    // Otherwise, do nothing.
                    this._debounceColorPickerEvent(maybeHexColor);
                }
            }
        });
        return labeledInput;
    }
    /**
	 * Validates the view and returns `false` when some fields are invalid.
	 */ isValid() {
        const { t } = this.locale;
        this.resetValidationStatus();
        // One error per field is enough.
        if (!this.hexInputRow.getParsedColor()) {
            // Apply updated error.
            this.hexInputRow.inputView.errorText = t('Please enter a valid color (e.g. "ff0000").');
            return false;
        }
        return true;
    }
    /**
	 * Cleans up the supplementary error and information text of input inside the {@link #hexInputRow}
	 * bringing them back to the state when the form has been displayed for the first time.
	 *
	 * See {@link #isValid}.
	 */ resetValidationStatus() {
        this.hexInputRow.inputView.errorText = null;
    }
}
// Converts any color format to a unified hex format.
//
// @param inputColor
// @returns An unified hex string.
function convertColorToCommonHexFormat(inputColor) {
    let ret = convertToHex(inputColor);
    if (!ret) {
        ret = '#000';
    }
    if (ret.length === 4) {
        // Unfold shortcut format.
        ret = '#' + [
            ret[1],
            ret[1],
            ret[2],
            ret[2],
            ret[3],
            ret[3]
        ].join('');
    }
    return ret.toLowerCase();
}
// View abstraction over pointer in color picker.
class SliderView extends View {
    /**
	 * @param element HTML element of slider in color picker.
	 */ constructor(element){
        super();
        this.element = element;
    }
    /**
	 * Focuses element.
	 */ focus() {
        this.element.focus();
    }
}
// View abstraction over the `#` character before color input.
class HashView extends View {
    constructor(locale){
        super(locale);
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-color-picker__hash-view'
                ]
            },
            children: '#'
        });
    }
}
// The class representing a row containing hex color input field.
// **Note**: For now this class is private. When more use cases appear (beyond `ckeditor5-table` and `ckeditor5-image`),
// it will become a component in `ckeditor5-ui`.
//
// @private
class ColorPickerInputRowView extends View {
    /**
	 * A collection of row items (buttons, dropdowns, etc.).
	 */ children;
    /**
	 * Hex input view element.
	 */ inputView;
    /**
	 * Creates an instance of the form row class.
	 *
	 * @param locale The locale instance.
	 * @param inputView Hex color input element.
	 */ constructor(locale, inputView){
        super(locale);
        this.inputView = inputView;
        this.children = this.createCollection([
            new HashView(),
            this.inputView
        ]);
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-color-picker__row'
                ]
            },
            children: this.children
        });
    }
    /**
	 * Returns false if color input value is not in hex format.
	 */ getParsedColor() {
        return tryParseHexColor(this.inputView.fieldView.element.value);
    }
}
/**
 * Trim spaces from provided color and check if hex is valid.
 *
 * @param color Unsafe color string.
 * @returns Null if provided color is not hex value.
 * @export
 */ function tryParseHexColor(color) {
    if (!color) {
        return null;
    }
    const hashLessColor = color.trim().replace(/^#/, '');
    // Incorrect length.
    if (![
        3,
        4,
        6,
        8
    ].includes(hashLessColor.length)) {
        return null;
    }
    // Incorrect characters.
    if (!/^(([0-9a-fA-F]{2}){3,4}|([0-9a-fA-F]){3,4})$/.test(hashLessColor)) {
        return null;
    }
    return `#${hashLessColor}`;
}

/**
 * A collection to store document colors. It enforces colors to be unique.
 */ class DocumentColorCollection extends /* #__PURE__ */ ObservableMixin(Collection) {
    constructor(options){
        super(options);
        this.set('isEmpty', true);
        this.on('change', ()=>{
            this.set('isEmpty', this.length === 0);
        });
    }
    /**
	 * Adds a color to the document color collection.
	 *
	 * This method ensures that no color duplicates are inserted (compared using
	 * the color value of the {@link module:ui/colorgrid/colorgridview~ColorDefinition}).
	 *
	 * If the item does not have an ID, it will be automatically generated and set on the item.
	 *
	 * @param index The position of the item in the collection. The item is pushed to the collection when `index` is not specified.
	 * @fires add
	 * @fires change
	 */ add(item, index) {
        if (this.find((element)=>element.color === item.color)) {
            // No duplicates are allowed.
            return this;
        }
        return super.add(item, index);
    }
    /**
	 * Checks if an object with given colors is present in the document color collection.
	 */ hasColor(color) {
        return !!this.find((item)=>item.color === color);
    }
}

/**
 * One of the fragments of {@link module:ui/colorselector/colorselectorview~ColorSelectorView}.
 *
 * It provides a UI that allows users to select colors from the a predefined set and from existing document colors.
 *
 * It consists of the following sub–components:
 *
 * * A "Remove color" button,
 * * A static {@link module:ui/colorgrid/colorgridview~ColorGridView} of colors defined in the configuration,
 * * A dynamic {@link module:ui/colorgrid/colorgridview~ColorGridView} of colors used in the document.
 * * If color picker is configured, the "Color Picker" button is visible too.
 */ class ColorGridsFragmentView extends View {
    /**
	 * A collection of the children of the table.
	 */ items;
    /**
	 * An array with objects representing colors to be displayed in the grid.
	 */ colorDefinitions;
    /**
	 * Tracks information about the DOM focus in the list.
	 */ focusTracker;
    /**
	 * The number of columns in the color grid.
	 */ columns;
    /**
	 * Preserves the reference to {@link module:ui/colorselector/documentcolorcollection~DocumentColorCollection} used to collect
	 * definitions that store the document colors.
	 *
	 * @readonly
	 */ documentColors;
    /**
	 * The maximum number of colors in the document colors section.
	 * If it equals 0, the document colors section is not added.
	 *
	 * @readonly
	 */ documentColorsCount;
    /**
	 * Preserves the reference to {@link module:ui/colorgrid/colorgridview~ColorGridView} used to create
	 * the default (static) color set.
	 *
	 * The property is loaded once the the parent dropdown is opened the first time.
	 *
	 * @readonly
	 */ staticColorsGrid;
    /**
	 * Preserves the reference to {@link module:ui/colorgrid/colorgridview~ColorGridView} used to create
	 * the document colors. It remains undefined if the document colors feature is disabled.
	 *
	 * The property is loaded once the the parent dropdown is opened the first time.
	 *
	 * @readonly
	 */ documentColorsGrid;
    /**
	 * The "Color picker" button view.
	 */ colorPickerButtonView;
    /**
	 * The "Remove color" button view.
	 */ removeColorButtonView;
    /**
	 * A collection of views that can be focused in the view.
	 *
	 * @readonly
	 */ _focusables;
    /**
	 * Document color section's label.
	 *
	 * @readonly
	 */ _documentColorsLabel;
    /**
	 * The label of the button responsible for removing color attributes.
	 */ _removeButtonLabel;
    /**
	 * The label of the button responsible for switching to the color picker component.
	 */ _colorPickerLabel;
    /**
	 * Creates an instance of the view.
	 *
	 * @param locale The localization services instance.
	 * @param colors An array with definitions of colors to be displayed in the table.
	 * @param columns The number of columns in the color grid.
	 * @param removeButtonLabel The label of the button responsible for removing the color.
	 * @param colorPickerLabel The label of the button responsible for color picker appearing.
	 * @param documentColorsLabel The label for the section with the document colors.
	 * @param documentColorsCount The number of colors in the document colors section inside the color dropdown.
	 * @param focusTracker Tracks information about the DOM focus in the list.
	 * @param focusables A collection of views that can be focused in the view.
	 */ constructor(locale, { colors, columns, removeButtonLabel, documentColorsLabel, documentColorsCount, colorPickerLabel, focusTracker, focusables }){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isVisible', true);
        this.focusTracker = focusTracker;
        this.items = this.createCollection();
        this.colorDefinitions = colors;
        this.columns = columns;
        this.documentColors = new DocumentColorCollection();
        this.documentColorsCount = documentColorsCount;
        this._focusables = focusables;
        this._removeButtonLabel = removeButtonLabel;
        this._colorPickerLabel = colorPickerLabel;
        this._documentColorsLabel = documentColorsLabel;
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck-color-grids-fragment',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ]
            },
            children: this.items
        });
        this.removeColorButtonView = this._createRemoveColorButton();
        this.items.add(this.removeColorButtonView);
    }
    /**
	 * Scans through the editor model and searches for text node attributes with the given attribute name.
	 * Found entries are set as document colors.
	 *
	 * All the previously stored document colors will be lost in the process.
	 *
	 * @param model The model used as a source to obtain the document colors.
	 * @param attributeName Determines the name of the related model's attribute for a given dropdown.
	 */ updateDocumentColors(model, attributeName) {
        const document = model.document;
        const maxCount = this.documentColorsCount;
        this.documentColors.clear();
        for (const root of document.getRoots()){
            const range = model.createRangeIn(root);
            for (const node of range.getItems()){
                if (node.is('$textProxy') && node.hasAttribute(attributeName)) {
                    this._addColorToDocumentColors(node.getAttribute(attributeName));
                    if (this.documentColors.length >= maxCount) {
                        return;
                    }
                }
            }
        }
    }
    /**
	 * Refreshes the state of the selected color in one or both {@link module:ui/colorgrid/colorgridview~ColorGridView}s
	 * available in the {@link module:ui/colorselector/colorselectorview~ColorSelectorView}. It guarantees that the selection will
	 * occur only in one of them.
	 */ updateSelectedColors() {
        const documentColorsGrid = this.documentColorsGrid;
        const staticColorsGrid = this.staticColorsGrid;
        const selectedColor = this.selectedColor;
        staticColorsGrid.selectedColor = selectedColor;
        if (documentColorsGrid) {
            documentColorsGrid.selectedColor = selectedColor;
        }
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.staticColorsGrid = this._createStaticColorsGrid();
        this.items.add(this.staticColorsGrid);
        if (this.documentColorsCount) {
            // Create a label for document colors.
            const bind = Template.bind(this.documentColors, this.documentColors);
            const label = new LabelView(this.locale);
            label.text = this._documentColorsLabel;
            label.extendTemplate({
                attributes: {
                    class: [
                        'ck',
                        'ck-color-grid__label',
                        bind.if('isEmpty', 'ck-hidden')
                    ]
                }
            });
            this.items.add(label);
            this.documentColorsGrid = this._createDocumentColorsGrid();
            this.items.add(this.documentColorsGrid);
        }
        this._createColorPickerButton();
        this._addColorSelectorElementsToFocusTracker();
    }
    /**
	 * Focuses the component.
	 */ focus() {
        this.removeColorButtonView.focus();
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
    }
    /**
	 * Handles displaying the color picker button (if it was previously created) and making it focusable.
	 */ addColorPickerButton() {
        if (this.colorPickerButtonView) {
            this.items.add(this.colorPickerButtonView);
            this.focusTracker.add(this.colorPickerButtonView.element);
            this._focusables.add(this.colorPickerButtonView);
        }
    }
    /**
	 * Adds color selector elements to focus tracker.
	 */ _addColorSelectorElementsToFocusTracker() {
        this.focusTracker.add(this.removeColorButtonView.element);
        this._focusables.add(this.removeColorButtonView);
        if (this.staticColorsGrid) {
            this.focusTracker.add(this.staticColorsGrid.element);
            this._focusables.add(this.staticColorsGrid);
        }
        if (this.documentColorsGrid) {
            this.focusTracker.add(this.documentColorsGrid.element);
            this._focusables.add(this.documentColorsGrid);
        }
    }
    /**
	 * Creates the button responsible for displaying the color picker component.
	 */ _createColorPickerButton() {
        this.colorPickerButtonView = new ButtonView();
        this.colorPickerButtonView.set({
            label: this._colorPickerLabel,
            withText: true,
            icon: icons.colorPalette,
            class: 'ck-color-selector__color-picker'
        });
        this.colorPickerButtonView.on('execute', ()=>{
            this.fire('colorPicker:show');
        });
    }
    /**
	 * Adds the remove color button as a child of the current view.
	 */ _createRemoveColorButton() {
        const buttonView = new ButtonView();
        buttonView.set({
            withText: true,
            icon: icons.eraser,
            label: this._removeButtonLabel
        });
        buttonView.class = 'ck-color-selector__remove-color';
        buttonView.on('execute', ()=>{
            this.fire('execute', {
                value: null,
                source: 'removeColorButton'
            });
        });
        buttonView.render();
        return buttonView;
    }
    /**
	 * Creates a static color grid based on the editor configuration.
	 */ _createStaticColorsGrid() {
        const colorGrid = new ColorGridView(this.locale, {
            colorDefinitions: this.colorDefinitions,
            columns: this.columns
        });
        colorGrid.on('execute', (evt, data)=>{
            this.fire('execute', {
                value: data.value,
                source: 'staticColorsGrid'
            });
        });
        return colorGrid;
    }
    /**
	 * Creates the document colors section view and binds it to {@link #documentColors}.
	 */ _createDocumentColorsGrid() {
        const bind = Template.bind(this.documentColors, this.documentColors);
        const documentColorsGrid = new ColorGridView(this.locale, {
            columns: this.columns
        });
        documentColorsGrid.extendTemplate({
            attributes: {
                class: bind.if('isEmpty', 'ck-hidden')
            }
        });
        documentColorsGrid.items.bindTo(this.documentColors).using((colorObj)=>{
            const colorTile = new ColorTileView();
            colorTile.set({
                color: colorObj.color,
                hasBorder: colorObj.options && colorObj.options.hasBorder
            });
            if (colorObj.label) {
                colorTile.set({
                    label: colorObj.label,
                    tooltip: true
                });
            }
            colorTile.on('execute', ()=>{
                this.fire('execute', {
                    value: colorObj.color,
                    source: 'documentColorsGrid'
                });
            });
            return colorTile;
        });
        // Selected color should be cleared when document colors became empty.
        this.documentColors.on('change:isEmpty', (evt, name, val)=>{
            if (val) {
                documentColorsGrid.selectedColor = null;
            }
        });
        return documentColorsGrid;
    }
    /**
	 * Adds a given color to the document colors list. If possible, the method will attempt to use
	 * data from the {@link #colorDefinitions} (label, color options).
	 *
	 * @param color A string that stores the value of the recently applied color.
	 */ _addColorToDocumentColors(color) {
        const predefinedColor = this.colorDefinitions.find((definition)=>definition.color === color);
        if (!predefinedColor) {
            this.documentColors.add({
                color,
                label: color,
                options: {
                    hasBorder: false
                }
            });
        } else {
            this.documentColors.add(Object.assign({}, predefinedColor));
        }
    }
}

/**
 * One of the fragments of {@link module:ui/colorselector/colorselectorview~ColorSelectorView}.
 *
 * It allows users to select a color from a color picker.
 *
 * It consists of the following sub–components:
 *
 * * A color picker saturation and hue sliders,
 * * A text input accepting colors in HEX format,
 * * "Save" and "Cancel" action buttons.
 */ class ColorPickerFragmentView extends View {
    /**
	 * A collection of component's children.
	 */ items;
    /**
	 * A view with saturation and hue sliders and color input.
	 */ colorPickerView;
    /**
	 * The "Save" button view.
	 */ saveButtonView;
    /**
	 * The "Cancel" button view.
	 */ cancelButtonView;
    /**
	 * The action bar where are "Save" button and "Cancel" button.
	 */ actionBarView;
    /**
	 * Tracks information about the DOM focus in the list.
	 */ focusTracker;
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes;
    /**
	 * A collection of views that can be focused in the view.
	 *
	 * @readonly
	 */ _focusables;
    /**
	 * A reference to the configuration of {@link #colorPickerView}. `false` when the view was
	 * configured without a color picker.
	 *
	 * @readonly
	 */ _colorPickerViewConfig;
    /**
	 * Creates an instance of the view.
	 *
	 * @param locale The localization services instance.
	 * @param focusTracker Tracks information about the DOM focus in the list.
	 * @param focusables A collection of views that can be focused in the view..
	 * @param keystrokes An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 * @param colorPickerViewConfig The configuration of color picker feature. If set to `false`, the color picker
	 * will not be rendered.
	 */ constructor(locale, { focusTracker, focusables, keystrokes, colorPickerViewConfig }){
        super(locale);
        this.items = this.createCollection();
        this.focusTracker = focusTracker;
        this.keystrokes = keystrokes;
        this.set('isVisible', false);
        this.set('selectedColor', undefined);
        this._focusables = focusables;
        this._colorPickerViewConfig = colorPickerViewConfig;
        const bind = this.bindTemplate;
        const { saveButtonView, cancelButtonView } = this._createActionButtons();
        this.saveButtonView = saveButtonView;
        this.cancelButtonView = cancelButtonView;
        this.actionBarView = this._createActionBarView({
            saveButtonView,
            cancelButtonView
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck-color-picker-fragment',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ]
            },
            children: this.items
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        const colorPickerView = new ColorPickerView(this.locale, {
            ...this._colorPickerViewConfig
        });
        this.colorPickerView = colorPickerView;
        this.colorPickerView.render();
        if (this.selectedColor) {
            colorPickerView.color = this.selectedColor;
        }
        this.listenTo(this, 'change:selectedColor', (evt, name, value)=>{
            colorPickerView.color = value;
        });
        this.items.add(this.colorPickerView);
        this.items.add(this.actionBarView);
        this._addColorPickersElementsToFocusTracker();
        this._stopPropagationOnArrowsKeys();
        this._executeOnEnterPress();
        this._executeUponColorChange();
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
    }
    /**
	 * Focuses the color picker.
	 */ focus() {
        this.colorPickerView.focus();
    }
    /**
	 * Reset validation messages.
	 */ resetValidationStatus() {
        this.colorPickerView.resetValidationStatus();
    }
    /**
	 * When color picker is focused and "enter" is pressed it executes command.
	 */ _executeOnEnterPress() {
        this.keystrokes.set('enter', (evt)=>{
            if (this.isVisible && this.focusTracker.focusedElement !== this.cancelButtonView.element && this.colorPickerView.isValid()) {
                this.fire('execute', {
                    value: this.selectedColor
                });
                evt.stopPropagation();
                evt.preventDefault();
            }
        });
    }
    /**
	 * Removes default behavior of arrow keys in dropdown.
	 */ _stopPropagationOnArrowsKeys() {
        const stopPropagation = (data)=>data.stopPropagation();
        this.keystrokes.set('arrowright', stopPropagation);
        this.keystrokes.set('arrowleft', stopPropagation);
        this.keystrokes.set('arrowup', stopPropagation);
        this.keystrokes.set('arrowdown', stopPropagation);
    }
    /**
	 * Adds color picker elements to focus tracker.
	 */ _addColorPickersElementsToFocusTracker() {
        for (const slider of this.colorPickerView.slidersView){
            this.focusTracker.add(slider.element);
            this._focusables.add(slider);
        }
        const input = this.colorPickerView.hexInputRow.children.get(1);
        if (input.element) {
            this.focusTracker.add(input.element);
            this._focusables.add(input);
        }
        this.focusTracker.add(this.saveButtonView.element);
        this._focusables.add(this.saveButtonView);
        this.focusTracker.add(this.cancelButtonView.element);
        this._focusables.add(this.cancelButtonView);
    }
    /**
	 * Creates bar containing "Save" and "Cancel" buttons.
	 */ _createActionBarView({ saveButtonView, cancelButtonView }) {
        const actionBarRow = new View();
        const children = this.createCollection();
        children.add(saveButtonView);
        children.add(cancelButtonView);
        actionBarRow.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-color-selector_action-bar'
                ]
            },
            children
        });
        return actionBarRow;
    }
    /**
	 * Creates "Save" and "Cancel" buttons.
	 */ _createActionButtons() {
        const locale = this.locale;
        const t = locale.t;
        const saveButtonView = new ButtonView(locale);
        const cancelButtonView = new ButtonView(locale);
        saveButtonView.set({
            icon: icons.check,
            class: 'ck-button-save',
            type: 'button',
            withText: false,
            label: t('Accept')
        });
        cancelButtonView.set({
            icon: icons.cancel,
            class: 'ck-button-cancel',
            type: 'button',
            withText: false,
            label: t('Cancel')
        });
        saveButtonView.on('execute', ()=>{
            if (this.colorPickerView.isValid()) {
                this.fire('execute', {
                    source: 'colorPickerSaveButton',
                    value: this.selectedColor
                });
            }
        });
        cancelButtonView.on('execute', ()=>{
            this.fire('colorPicker:cancel');
        });
        return {
            saveButtonView,
            cancelButtonView
        };
    }
    /**
	 * Fires the `execute` event if color in color picker has been changed
	 * by the user.
	 */ _executeUponColorChange() {
        this.colorPickerView.on('colorSelected', (evt, data)=>{
            this.fire('execute', {
                value: data.color,
                source: 'colorPicker'
            });
            this.set('selectedColor', data.color);
        });
    }
}

/**
 * The configurable color selector view class. It allows users to select colors from a predefined set of colors as well as from
 * a color picker.
 *
 * This meta-view is is made of two components (fragments):
 *
 * * {@link module:ui/colorselector/colorselectorview~ColorSelectorView#colorGridsFragmentView},
 * * {@link module:ui/colorselector/colorselectorview~ColorSelectorView#colorPickerFragmentView}.
 *
 * ```ts
 * const colorDefinitions = [
 * 	{ color: '#000', label: 'Black', options: { hasBorder: false } },
 * 	{ color: 'rgb(255, 255, 255)', label: 'White', options: { hasBorder: true } },
 * 	{ color: 'red', label: 'Red', options: { hasBorder: false } }
 * ];
 *
 * const selectorView = new ColorSelectorView( locale, {
 * 	colors: colorDefinitions,
 * 	columns: 5,
 * 	removeButtonLabel: 'Remove color',
 * 	documentColorsLabel: 'Document colors',
 * 	documentColorsCount: 4,
 * 	colorPickerViewConfig: {
 * 		format: 'hsl'
 * 	}
 * } );
 *
 * selectorView.appendUI();
 * selectorView.selectedColor = 'red';
 * selectorView.updateSelectedColors();
 *
 * selectorView.on<ColorSelectorExecuteEvent>( 'execute', ( evt, data ) => {
 * 	console.log( 'Color changed', data.value, data.source );
 * } );
 *
 * selectorView.on<ColorSelectorColorPickerShowEvent>( 'colorPicker:show', ( evt ) => {
 * 	console.log( 'Color picker showed up', evt );
 * } );
 *
 * selectorView.on<ColorSelectorColorPickerCancelEvent>( 'colorPicker:cancel', ( evt ) => {
 * 	console.log( 'Color picker cancel', evt );
 * } );
 *
 * selectorView.render();
 *
 * document.body.appendChild( selectorView.element );
 * ```
 */ class ColorSelectorView extends View {
    /**
	 * Tracks information about the DOM focus in the list.
	 */ focusTracker;
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes;
    /**
	 * A collection of components.
	 */ items;
    /**
	 * A fragment that allows users to select colors from the a predefined set and from existing document colors.
	 */ colorGridsFragmentView;
    /**
	 * A fragment that allows users to select a color from a color picker.
	 */ colorPickerFragmentView;
    /**
	 * Helps cycling over focusable {@link #items} in the list.
	 *
	 * @readonly
	 */ _focusCycler;
    /**
	 * A collection of views that can be focused in the view.
	 *
	 * @readonly
	 */ _focusables;
    /**
	 * The configuration of color picker sub-component.
	 */ _colorPickerViewConfig;
    /**
	 * Creates a view to be inserted as a child of {@link module:ui/dropdown/dropdownview~DropdownView}.
	 *
	 * @param locale The localization services instance.
	 * @param colors An array with definitions of colors to be displayed in the table.
	 * @param columns The number of columns in the color grid.
	 * @param removeButtonLabel The label of the button responsible for removing the color.
	 * @param colorPickerLabel The label of the button responsible for color picker appearing.
	 * @param documentColorsLabel The label for the section with the document colors.
	 * @param documentColorsCount The number of colors in the document colors section inside the color dropdown.
	 * @param colorPickerViewConfig The configuration of color picker feature. If set to `false`, the color picker will be hidden.
	 */ constructor(locale, { colors, columns, removeButtonLabel, documentColorsLabel, documentColorsCount, colorPickerLabel, colorPickerViewConfig }){
        super(locale);
        this.items = this.createCollection();
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this._focusables = new ViewCollection();
        this._colorPickerViewConfig = colorPickerViewConfig;
        this._focusCycler = new FocusCycler({
            focusables: this._focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate list items backwards using the <kbd>Shift</kbd> + <kbd>Tab</kbd> keystroke.
                focusPrevious: 'shift + tab',
                // Navigate list items forwards using the <kbd>Tab</kbd> key.
                focusNext: 'tab'
            }
        });
        this.colorGridsFragmentView = new ColorGridsFragmentView(locale, {
            colors,
            columns,
            removeButtonLabel,
            documentColorsLabel,
            documentColorsCount,
            colorPickerLabel,
            focusTracker: this.focusTracker,
            focusables: this._focusables
        });
        this.colorPickerFragmentView = new ColorPickerFragmentView(locale, {
            focusables: this._focusables,
            focusTracker: this.focusTracker,
            keystrokes: this.keystrokes,
            colorPickerViewConfig
        });
        this.set('_isColorGridsFragmentVisible', true);
        this.set('_isColorPickerFragmentVisible', false);
        this.set('selectedColor', undefined);
        this.colorGridsFragmentView.bind('isVisible').to(this, '_isColorGridsFragmentVisible');
        this.colorPickerFragmentView.bind('isVisible').to(this, '_isColorPickerFragmentVisible');
        /**
		 * This is kind of bindings. Unfortunately we could not use this.bind() method because the same property
		 * can not be bound twice. So this is work around how to bind 'selectedColor' property between components.
		 */ this.on('change:selectedColor', (evt, evtName, data)=>{
            this.colorGridsFragmentView.set('selectedColor', data);
            this.colorPickerFragmentView.set('selectedColor', data);
        });
        this.colorGridsFragmentView.on('change:selectedColor', (evt, evtName, data)=>{
            this.set('selectedColor', data);
        });
        this.colorPickerFragmentView.on('change:selectedColor', (evt, evtName, data)=>{
            this.set('selectedColor', data);
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-color-selector'
                ]
            },
            children: this.items
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
    /**
	 * Renders the internals of the component on demand:
	 * * {@link #colorPickerFragmentView},
	 * * {@link #colorGridsFragmentView}.
	 *
	 * It allows for deferring component initialization to improve the performance.
	 *
	 * See {@link #showColorPickerFragment}, {@link #showColorGridsFragment}.
	 */ appendUI() {
        this._appendColorGridsFragment();
        if (this._colorPickerViewConfig) {
            this._appendColorPickerFragment();
        }
    }
    /**
	 * Shows the {@link #colorPickerFragmentView} and hides the {@link #colorGridsFragmentView}.
	 *
	 * **Note**: It requires {@link #appendUI} to be called first.
	 *
	 * See {@link #showColorGridsFragment}, {@link ~ColorSelectorView#event:colorPicker:show}.
	 */ showColorPickerFragment() {
        if (!this.colorPickerFragmentView.colorPickerView || this._isColorPickerFragmentVisible) {
            return;
        }
        this._isColorPickerFragmentVisible = true;
        this.colorPickerFragmentView.focus();
        this.colorPickerFragmentView.resetValidationStatus();
        this._isColorGridsFragmentVisible = false;
    }
    /**
	 * Shows the {@link #colorGridsFragmentView} and hides the {@link #colorPickerFragmentView}.
	 *
	 * See {@link #showColorPickerFragment}.
	 *
	 * **Note**: It requires {@link #appendUI} to be called first.
	 */ showColorGridsFragment() {
        if (this._isColorGridsFragmentVisible) {
            return;
        }
        this._isColorGridsFragmentVisible = true;
        this.colorGridsFragmentView.focus();
        this._isColorPickerFragmentVisible = false;
    }
    /**
	 * Focuses the first focusable element in {@link #items}.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the last focusable element in {@link #items}.
	 */ focusLast() {
        this._focusCycler.focusLast();
    }
    /**
	 * Scans through the editor model and searches for text node attributes with the given `attributeName`.
	 * Found entries are set as document colors in {@link #colorGridsFragmentView}.
	 *
	 * All the previously stored document colors will be lost in the process.
	 *
	 * @param model The model used as a source to obtain the document colors.
	 * @param attributeName Determines the name of the related model's attribute for a given dropdown.
	 */ updateDocumentColors(model, attributeName) {
        this.colorGridsFragmentView.updateDocumentColors(model, attributeName);
    }
    /**
	 * Refreshes the state of the selected color in one or both grids located in {@link #colorGridsFragmentView}.
	 *
	 * It guarantees that the selection will occur only in one of them.
	 */ updateSelectedColors() {
        this.colorGridsFragmentView.updateSelectedColors();
    }
    /**
	 * Appends the view containing static and document color grid views.
	 */ _appendColorGridsFragment() {
        if (this.items.length) {
            return;
        }
        this.items.add(this.colorGridsFragmentView);
        this.colorGridsFragmentView.delegate('execute').to(this);
        this.colorGridsFragmentView.delegate('colorPicker:show').to(this);
    }
    /**
	 * Appends the view with the color picker.
	 */ _appendColorPickerFragment() {
        if (this.items.length === 2) {
            return;
        }
        this.items.add(this.colorPickerFragmentView);
        if (this.colorGridsFragmentView.colorPickerButtonView) {
            this.colorGridsFragmentView.colorPickerButtonView.on('execute', ()=>{
                this.showColorPickerFragment();
            });
        }
        this.colorGridsFragmentView.addColorPickerButton();
        this.colorPickerFragmentView.delegate('execute').to(this);
        this.colorPickerFragmentView.delegate('colorPicker:cancel').to(this);
    }
}

/**
 * A helper class implementing the UI component ({@link module:ui/view~View view}) factory.
 *
 * It allows functions producing specific UI components to be registered under their unique names
 * in the factory. A registered component can be then instantiated by providing its name.
 * Note that the names are case insensitive.
 *
 * ```ts
 * // The editor provides localization tools for the factory.
 * const factory = new ComponentFactory( editor );
 *
 * factory.add( 'foo', locale => new FooView( locale ) );
 * factory.add( 'bar', locale => new BarView( locale ) );
 *
 * // An instance of FooView.
 * const fooInstance = factory.create( 'foo' );
 *
 * // Names are case insensitive so this is also allowed:
 * const barInstance = factory.create( 'Bar' );
 * ```
 *
 * The {@link module:core/editor/editor~Editor#locale editor locale} is passed to the factory
 * function when {@link module:ui/componentfactory~ComponentFactory#create} is called.
 */ class ComponentFactory {
    /**
	 * The editor instance that the factory belongs to.
	 */ editor;
    /**
	 * Registered component factories.
	 */ _components = new Map();
    /**
	 * Creates an instance of the factory.
	 *
	 * @param editor The editor instance.
	 */ constructor(editor){
        this.editor = editor;
    }
    /**
	 * Returns an iterator of registered component names. Names are returned in lower case.
	 */ *names() {
        for (const value of this._components.values()){
            yield value.originalName;
        }
    }
    /**
	 * Registers a component factory function that will be used by the
	 * {@link #create create} method and called with the
	 * {@link module:core/editor/editor~Editor#locale editor locale} as an argument,
	 * allowing localization of the {@link module:ui/view~View view}.
	 *
	 * @param name The name of the component.
	 * @param callback The callback that returns the component.
	 */ add(name, callback) {
        this._components.set(getNormalized(name), {
            callback,
            originalName: name
        });
    }
    /**
	 * Creates an instance of a component registered in the factory under a specific name.
	 *
	 * When called, the {@link module:core/editor/editor~Editor#locale editor locale} is passed to
	 * the previously {@link #add added} factory function, allowing localization of the
	 * {@link module:ui/view~View view}.
	 *
	 * @param name The name of the component.
	 * @returns The instantiated component view.
	 */ create(name) {
        if (!this.has(name)) {
            /**
			 * The required component is not registered in the component factory. Please make sure
			 * the provided name is correct and the component has been correctly
			 * {@link module:ui/componentfactory~ComponentFactory#add added} to the factory.
			 *
			 * @error componentfactory-item-missing
			 * @param name The name of the missing component.
			 */ throw new CKEditorError('componentfactory-item-missing', this, {
                name
            });
        }
        return this._components.get(getNormalized(name)).callback(this.editor.locale);
    }
    /**
	 * Checks if a component of a given name is registered in the factory.
	 *
	 * @param name The name of the component.
	 */ has(name) {
        return this._components.has(getNormalized(name));
    }
}
/**
 * Ensures that the component name used as the key in the internal map is in lower case.
 */ function getNormalized(name) {
    return String(name).toLowerCase();
}

const toPx$5 = /* #__PURE__ */ toUnit('px');
// A static balloon panel positioning function that moves the balloon far off the viewport.
// It is used as a fallback when there is no way to position the balloon using provided
// positioning functions (see: `getOptimalPosition()`), for instance, when the target the
// balloon should be attached to gets obscured by scrollable containers or the viewport.
//
// It prevents the balloon from being attached to the void and possible degradation of the UX.
// At the same time, it keeps the balloon physically visible in the DOM so the focus remains
// uninterrupted.
const POSITION_OFF_SCREEN = {
    top: -99999,
    left: -99999,
    name: 'arrowless',
    config: {
        withArrow: false
    }
};
/**
 * The balloon panel view class.
 *
 * A floating container which can
 * {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView#pin pin} to any
 * {@link module:utils/dom/position~Options#target target} in the DOM and remain in that position
 * e.g. when the web page is scrolled.
 *
 * The balloon panel can be used to display contextual, non-blocking UI like forms, toolbars and
 * the like in its {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView#content} view
 * collection.
 *
 * There is a number of {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.defaultPositions}
 * that the balloon can use, automatically switching from one to another when the viewport space becomes
 * scarce to keep the balloon visible to the user as long as it is possible. The balloon will also
 * accept any custom position set provided by the user compatible with the
 * {@link module:utils/dom/position~Options options}.
 *
 * ```ts
 * const panel = new BalloonPanelView( locale );
 * const childView = new ChildView();
 * const positions = BalloonPanelView.defaultPositions;
 *
 * panel.render();
 *
 * // Add a child view to the panel's content collection.
 * panel.content.add( childView );
 *
 * // Start pinning the panel to an element with the "target" id DOM.
 * // The balloon will remain pinned until unpin() is called.
 * panel.pin( {
 * 	target: document.querySelector( '#target' ),
 * 	positions: [
 * 		positions.northArrowSouth,
 * 		positions.southArrowNorth
 * 	]
 * } );
 * ```
 */ class BalloonPanelView extends View {
    /**
	 * A collection of the child views that creates the balloon panel contents.
	 */ content;
    /**
	 * A callback that starts pinning the panel when {@link #isVisible} gets
	 * `true`. Used by {@link #pin}.
	 *
	 * @private
	 */ _pinWhenIsVisibleCallback;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('top', 0);
        this.set('left', 0);
        this.set('position', 'arrow_nw');
        this.set('isVisible', false);
        this.set('withArrow', true);
        this.set('class', undefined);
        this._pinWhenIsVisibleCallback = null;
        this.content = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-balloon-panel',
                    bind.to('position', (value)=>`ck-balloon-panel_${value}`),
                    bind.if('isVisible', 'ck-balloon-panel_visible'),
                    bind.if('withArrow', 'ck-balloon-panel_with-arrow'),
                    bind.to('class')
                ],
                style: {
                    top: bind.to('top', toPx$5),
                    left: bind.to('left', toPx$5)
                }
            },
            children: this.content
        });
    }
    /**
	 * Shows the panel.
	 *
	 * See {@link #isVisible}.
	 */ show() {
        this.isVisible = true;
    }
    /**
	 * Hides the panel.
	 *
	 * See {@link #isVisible}.
	 */ hide() {
        this.isVisible = false;
    }
    /**
	 * Attaches the panel to a specified {@link module:utils/dom/position~Options#target} with a
	 * smart positioning heuristics that chooses from available positions to make sure the panel
	 * is visible to the user i.e. within the limits of the viewport.
	 *
	 * This method accepts configuration {@link module:utils/dom/position~Options options}
	 * to set the `target`, optional `limiter` and `positions` the balloon should choose from.
	 *
	 * ```ts
	 * const panel = new BalloonPanelView( locale );
	 * const positions = BalloonPanelView.defaultPositions;
	 *
	 * panel.render();
	 *
	 * // Attach the panel to an element with the "target" id DOM.
	 * panel.attachTo( {
	 * 	target: document.querySelector( '#target' ),
	 * 	positions: [
	 * 		positions.northArrowSouth,
	 * 		positions.southArrowNorth
	 * 	]
	 * } );
	 * ```
	 *
	 * **Note**: Attaching the panel will also automatically {@link #show} it.
	 *
	 * **Note**: An attached panel will not follow its target when the window is scrolled or resized.
	 * See the {@link #pin} method for a more permanent positioning strategy.
	 *
	 * @param options Positioning options compatible with {@link module:utils/dom/position~getOptimalPosition}.
	 * Default `positions` array is {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.defaultPositions}.
	 */ attachTo(options) {
        this.show();
        const defaultPositions = BalloonPanelView.defaultPositions;
        const positionOptions = Object.assign({}, {
            element: this.element,
            positions: [
                defaultPositions.southArrowNorth,
                defaultPositions.southArrowNorthMiddleWest,
                defaultPositions.southArrowNorthMiddleEast,
                defaultPositions.southArrowNorthWest,
                defaultPositions.southArrowNorthEast,
                defaultPositions.northArrowSouth,
                defaultPositions.northArrowSouthMiddleWest,
                defaultPositions.northArrowSouthMiddleEast,
                defaultPositions.northArrowSouthWest,
                defaultPositions.northArrowSouthEast,
                defaultPositions.viewportStickyNorth
            ],
            limiter: global.document.body,
            fitInViewport: true
        }, options);
        const optimalPosition = BalloonPanelView._getOptimalPosition(positionOptions) || POSITION_OFF_SCREEN;
        // Usually browsers make some problems with super accurate values like 104.345px
        // so it is better to use int values.
        const left = parseInt(optimalPosition.left);
        const top = parseInt(optimalPosition.top);
        const position = optimalPosition.name;
        const config = optimalPosition.config || {};
        const { withArrow = true } = config;
        this.top = top;
        this.left = left;
        this.position = position;
        this.withArrow = withArrow;
    }
    /**
	 * Works the same way as the {@link #attachTo} method except that the position of the panel is
	 * continuously updated when:
	 *
	 * * any ancestor of the {@link module:utils/dom/position~Options#target}
	 * or {@link module:utils/dom/position~Options#limiter} is scrolled,
	 * * the browser window gets resized or scrolled.
	 *
	 * Thanks to that, the panel always sticks to the {@link module:utils/dom/position~Options#target}
	 * and is immune to the changing environment.
	 *
	 * ```ts
	 * const panel = new BalloonPanelView( locale );
	 * const positions = BalloonPanelView.defaultPositions;
	 *
	 * panel.render();
	 *
	 * // Pin the panel to an element with the "target" id DOM.
	 * panel.pin( {
	 * 	target: document.querySelector( '#target' ),
	 * 	positions: [
	 * 		positions.northArrowSouth,
	 * 		positions.southArrowNorth
	 * 	]
	 * } );
	 * ```
	 *
	 * To leave the pinned state, use the {@link #unpin} method.
	 *
	 * **Note**: Pinning the panel will also automatically {@link #show} it.
	 *
	 * @param options Positioning options compatible with {@link module:utils/dom/position~getOptimalPosition}.
	 * Default `positions` array is {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.defaultPositions}.
	 */ pin(options) {
        this.unpin();
        this._pinWhenIsVisibleCallback = ()=>{
            if (this.isVisible) {
                this._startPinning(options);
            } else {
                this._stopPinning();
            }
        };
        this._startPinning(options);
        // Control the state of the listeners depending on whether the panel is visible
        // or not.
        // TODO: Use on() (https://github.com/ckeditor/ckeditor5-utils/issues/144).
        this.listenTo(this, 'change:isVisible', this._pinWhenIsVisibleCallback);
    }
    /**
	 * Stops pinning the panel, as set up by {@link #pin}.
	 */ unpin() {
        if (this._pinWhenIsVisibleCallback) {
            // Deactivate listeners attached by pin().
            this._stopPinning();
            // Deactivate the panel pin() control logic.
            // TODO: Use off() (https://github.com/ckeditor/ckeditor5-utils/issues/144).
            this.stopListening(this, 'change:isVisible', this._pinWhenIsVisibleCallback);
            this._pinWhenIsVisibleCallback = null;
            this.hide();
        }
    }
    /**
	 * Starts managing the pinned state of the panel. See {@link #pin}.
	 *
	 * @param options Positioning options compatible with {@link module:utils/dom/position~getOptimalPosition}.
	 */ _startPinning(options) {
        this.attachTo(options);
        const targetElement = getDomElement(options.target);
        const limiterElement = options.limiter ? getDomElement(options.limiter) : global.document.body;
        // Then we need to listen on scroll event of eny element in the document.
        this.listenTo(global.document, 'scroll', (evt, domEvt)=>{
            const scrollTarget = domEvt.target;
            // The position needs to be updated if the positioning target is within the scrolled element.
            const isWithinScrollTarget = targetElement && scrollTarget.contains(targetElement);
            // The position needs to be updated if the positioning limiter is within the scrolled element.
            const isLimiterWithinScrollTarget = limiterElement && scrollTarget.contains(limiterElement);
            // The positioning target and/or limiter can be a Rect, object etc..
            // There's no way to optimize the listener then.
            if (isWithinScrollTarget || isLimiterWithinScrollTarget || !targetElement || !limiterElement) {
                this.attachTo(options);
            }
        }, {
            useCapture: true
        });
        // We need to listen on window resize event and update position.
        this.listenTo(global.window, 'resize', ()=>{
            this.attachTo(options);
        });
    }
    /**
	 * Stops managing the pinned state of the panel. See {@link #pin}.
	 */ _stopPinning() {
        this.stopListening(global.document, 'scroll');
        this.stopListening(global.window, 'resize');
    }
    /**
	 * Returns available {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView}
	 * {@link module:utils/dom/position~PositioningFunction positioning functions} adjusted by the specific offsets.
	 *
	 * @internal
	 * @param options Options to generate positions. If not specified, this helper will simply return
	 * {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.defaultPositions}.
	 * @param options.sideOffset A custom side offset (in pixels) of each position. If
	 * not specified, {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.arrowSideOffset the default value}
	 * will be used.
	 * @param options.heightOffset A custom height offset (in pixels) of each position. If
	 * not specified, {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.arrowHeightOffset the default value}
	 * will be used.
	 * @param options.stickyVerticalOffset A custom offset (in pixels) of the `viewportStickyNorth` positioning function.
	 * If not specified, {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.stickyVerticalOffset the default value}
	 * will be used.
	 * @param options.config Additional configuration of the balloon balloon panel view.
	 * Currently only {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView#withArrow} is supported. Learn more
	 * about {@link module:utils/dom/position~PositioningFunction positioning functions}.
	 */ static generatePositions(options = {}) {
        const { sideOffset = BalloonPanelView.arrowSideOffset, heightOffset = BalloonPanelView.arrowHeightOffset, stickyVerticalOffset = BalloonPanelView.stickyVerticalOffset, config } = options;
        return {
            // ------- North west
            northWestArrowSouthWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left - sideOffset,
                    name: 'arrow_sw',
                    ...config && {
                        config
                    }
                }),
            northWestArrowSouthMiddleWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left - balloonRect.width * .25 - sideOffset,
                    name: 'arrow_smw',
                    ...config && {
                        config
                    }
                }),
            northWestArrowSouth: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left - balloonRect.width / 2,
                    name: 'arrow_s',
                    ...config && {
                        config
                    }
                }),
            northWestArrowSouthMiddleEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left - balloonRect.width * .75 + sideOffset,
                    name: 'arrow_sme',
                    ...config && {
                        config
                    }
                }),
            northWestArrowSouthEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left - balloonRect.width + sideOffset,
                    name: 'arrow_se',
                    ...config && {
                        config
                    }
                }),
            // ------- North
            northArrowSouthWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left + targetRect.width / 2 - sideOffset,
                    name: 'arrow_sw',
                    ...config && {
                        config
                    }
                }),
            northArrowSouthMiddleWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width * .25 - sideOffset,
                    name: 'arrow_smw',
                    ...config && {
                        config
                    }
                }),
            northArrowSouth: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width / 2,
                    name: 'arrow_s',
                    ...config && {
                        config
                    }
                }),
            northArrowSouthMiddleEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width * .75 + sideOffset,
                    name: 'arrow_sme',
                    ...config && {
                        config
                    }
                }),
            northArrowSouthEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width + sideOffset,
                    name: 'arrow_se',
                    ...config && {
                        config
                    }
                }),
            // ------- North east
            northEastArrowSouthWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.right - sideOffset,
                    name: 'arrow_sw',
                    ...config && {
                        config
                    }
                }),
            northEastArrowSouthMiddleWest: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.right - balloonRect.width * .25 - sideOffset,
                    name: 'arrow_smw',
                    ...config && {
                        config
                    }
                }),
            northEastArrowSouth: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.right - balloonRect.width / 2,
                    name: 'arrow_s',
                    ...config && {
                        config
                    }
                }),
            northEastArrowSouthMiddleEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.right - balloonRect.width * .75 + sideOffset,
                    name: 'arrow_sme',
                    ...config && {
                        config
                    }
                }),
            northEastArrowSouthEast: (targetRect, balloonRect)=>({
                    top: getNorthTop(targetRect, balloonRect),
                    left: targetRect.right - balloonRect.width + sideOffset,
                    name: 'arrow_se',
                    ...config && {
                        config
                    }
                }),
            // ------- South west
            southWestArrowNorthWest: (targetRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left - sideOffset,
                    name: 'arrow_nw',
                    ...config && {
                        config
                    }
                }),
            southWestArrowNorthMiddleWest: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left - balloonRect.width * .25 - sideOffset,
                    name: 'arrow_nmw',
                    ...config && {
                        config
                    }
                }),
            southWestArrowNorth: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left - balloonRect.width / 2,
                    name: 'arrow_n',
                    ...config && {
                        config
                    }
                }),
            southWestArrowNorthMiddleEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left - balloonRect.width * .75 + sideOffset,
                    name: 'arrow_nme',
                    ...config && {
                        config
                    }
                }),
            southWestArrowNorthEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left - balloonRect.width + sideOffset,
                    name: 'arrow_ne',
                    ...config && {
                        config
                    }
                }),
            // ------- South
            southArrowNorthWest: (targetRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left + targetRect.width / 2 - sideOffset,
                    name: 'arrow_nw',
                    ...config && {
                        config
                    }
                }),
            southArrowNorthMiddleWest: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width * 0.25 - sideOffset,
                    name: 'arrow_nmw',
                    ...config && {
                        config
                    }
                }),
            southArrowNorth: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width / 2,
                    name: 'arrow_n',
                    ...config && {
                        config
                    }
                }),
            southArrowNorthMiddleEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width * 0.75 + sideOffset,
                    name: 'arrow_nme',
                    ...config && {
                        config
                    }
                }),
            southArrowNorthEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width + sideOffset,
                    name: 'arrow_ne',
                    ...config && {
                        config
                    }
                }),
            // ------- South east
            southEastArrowNorthWest: (targetRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.right - sideOffset,
                    name: 'arrow_nw',
                    ...config && {
                        config
                    }
                }),
            southEastArrowNorthMiddleWest: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.right - balloonRect.width * .25 - sideOffset,
                    name: 'arrow_nmw',
                    ...config && {
                        config
                    }
                }),
            southEastArrowNorth: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.right - balloonRect.width / 2,
                    name: 'arrow_n',
                    ...config && {
                        config
                    }
                }),
            southEastArrowNorthMiddleEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.right - balloonRect.width * .75 + sideOffset,
                    name: 'arrow_nme',
                    ...config && {
                        config
                    }
                }),
            southEastArrowNorthEast: (targetRect, balloonRect)=>({
                    top: getSouthTop(targetRect),
                    left: targetRect.right - balloonRect.width + sideOffset,
                    name: 'arrow_ne',
                    ...config && {
                        config
                    }
                }),
            // ------- West
            westArrowEast: (targetRect, balloonRect)=>({
                    top: targetRect.top + targetRect.height / 2 - balloonRect.height / 2,
                    left: targetRect.left - balloonRect.width - heightOffset,
                    name: 'arrow_e',
                    ...config && {
                        config
                    }
                }),
            // ------- East
            eastArrowWest: (targetRect, balloonRect)=>({
                    top: targetRect.top + targetRect.height / 2 - balloonRect.height / 2,
                    left: targetRect.right + heightOffset,
                    name: 'arrow_w',
                    ...config && {
                        config
                    }
                }),
            // ------- Sticky
            viewportStickyNorth: (targetRect, balloonRect, viewportRect, limiterRect)=>{
                const boundaryRect = limiterRect || viewportRect;
                if (!targetRect.getIntersection(boundaryRect)) {
                    return null;
                }
                // Engage when the target top and bottom edges are close or off the boundary.
                // By close, it means there's not enough space for the balloon arrow (offset).
                if (boundaryRect.height - targetRect.height > stickyVerticalOffset) {
                    return null;
                }
                return {
                    top: boundaryRect.top + stickyVerticalOffset,
                    left: targetRect.left + targetRect.width / 2 - balloonRect.width / 2,
                    name: 'arrowless',
                    config: {
                        withArrow: false,
                        ...config
                    }
                };
            }
        };
        /**
		 * Returns the top coordinate for positions starting with `north*`.
		 *
		 * @param targetRect A rect of the target.
		 * @param balloonRect A rect of the balloon.
		 */ function getNorthTop(targetRect, balloonRect) {
            return targetRect.top - balloonRect.height - heightOffset;
        }
        /**
		 * Returns the top coordinate for positions starting with `south*`.
		 *
		 * @param targetRect A rect of the target.
		 */ function getSouthTop(targetRect) {
            return targetRect.bottom + heightOffset;
        }
    }
    /**
	 * A side offset of the arrow tip from the edge of the balloon. Controlled by CSS.
	 *
	 * ```
	 *		 ┌───────────────────────┐
	 *		 │                       │
	 *		 │         Balloon       │
	 *		 │         Content       │
	 *		 │                       │
	 *		 └──+    +───────────────┘
	 *		 |   \  /
	 *		 |    \/
	 *		>┼─────┼< ─────────────────────── side offset
	 *
	 * ```
	 *
	 * @default 25
	 */ static arrowSideOffset = 25;
    /**
	 * A height offset of the arrow from the edge of the balloon. Controlled by CSS.
	 *
	 * ```
	 *		 ┌───────────────────────┐
	 *		 │                       │
	 *		 │         Balloon       │
	 *		 │         Content       │      ╱-- arrow height offset
	 *		 │                       │      V
	 *		 └──+    +───────────────┘ --- ─┼───────
	 *		     \  /                       │
	 *		      \/                        │
	 *		────────────────────────────────┼───────
	 *		                                ^
	 *
	 *
	 *		>┼────┼<  arrow height offset
	 *		 │    │
	 *		 │    ┌────────────────────────┐
	 *		 │    │                        │
	 *		 │   ╱                         │
	 *		 │ ╱            Balloon        │
	 *		 │ ╲            Content        │
	 *		 │   ╲                         │
	 *		 │    │                        │
	 *		 │    └────────────────────────┘
	 * ```
	 *
	 * @default 10
	*/ static arrowHeightOffset = 10;
    /**
	 * A vertical offset of the balloon panel from the edge of the viewport if sticky.
	 * It helps in accessing toolbar buttons underneath the balloon panel.
	 *
	 * ```
	 *		  ┌───────────────────────────────────────────────────┐
	 *		  │                      Target                       │
	 *		  │                                                   │
	 *		  │                            /── vertical offset    │
	 *		┌─────────────────────────────V─────────────────────────┐
	 *		│ Toolbar            ┌─────────────┐                    │
	 *		├────────────────────│   Balloon   │────────────────────┤
	 *		│ │                  └─────────────┘                  │ │
	 *		│ │                                                   │ │
	 *		│ │                                                   │ │
	 *		│ │                                                   │ │
	 *		│ └───────────────────────────────────────────────────┘ │
	 *		│                        Viewport                       │
	 *		└───────────────────────────────────────────────────────┘
	 * ```
	 *
	 * @default 20
	 */ static stickyVerticalOffset = 20;
    /**
	 * Function used to calculate the optimal position for the balloon.
	 */ static _getOptimalPosition = getOptimalPosition;
    /**
	 * A default set of positioning functions used by the balloon panel view
	 * when attaching using the {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView#attachTo} method.
	 *
	 * The available positioning functions are as follows:
	 *
	 * **North west**
	 *
	 * * `northWestArrowSouthWest`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		 V
	 *		 [ Target ]
	 * ```
	 *
	 * * `northWestArrowSouthMiddleWest`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		    V
	 *		    [ Target ]
	 * ```
	 *
	 * * `northWestArrowSouth`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		         V
	 *		         [ Target ]
	 * ```
	 *
	 * * `northWestArrowSouthMiddleEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		             V
	 *		             [ Target ]
	 * ```
	 *
	 * * `northWestArrowSouthEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		                 V
	 *		                 [ Target ]
	 * ```
	 *
	 * **North**
	 *
	 * * `northArrowSouthWest`
	 *
	 * ```
	 *		    +-----------------+
	 *		    |     Balloon     |
	 *		    +-----------------+
	 *		     V
	 *		[ Target ]
	 * ```
	 *
	 * * `northArrowSouthMiddleWest`
	 *
	 * ```
	 *		 +-----------------+
	 *		 |     Balloon     |
	 *		 +-----------------+
	 *		     V
	 *		[ Target ]
	 * ```
	 * * `northArrowSouth`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		         V
	 *		    [ Target ]
	 * ```
	 *
	 * * `northArrowSouthMiddleEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		             V
	 *		        [ Target ]
	 * ```
	 *
	 * * `northArrowSouthEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		                V
	 *		           [ Target ]
	 * ```
	 *
	 * **North east**
	 *
	 * * `northEastArrowSouthWest`
	 *
	 * ```
	 *		        +-----------------+
	 *		        |     Balloon     |
	 *		        +-----------------+
	 *		         V
	 *		[ Target ]
	 * ```
	 *
	 * * `northEastArrowSouthMiddleWest`
	 *
	 * ```
	 *		     +-----------------+
	 *		     |     Balloon     |
	 *		     +-----------------+
	 *		         V
	 *		[ Target ]
	 * ```
	 *
	 * * `northEastArrowSouth`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		         V
	 *		[ Target ]
	 * ```
	 *
	 * * `northEastArrowSouthMiddleEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		             V
	 *		    [ Target ]
	 * ```
	 *
	 * * `northEastArrowSouthEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 *		                 V
	 *		        [ Target ]
	 * ```
	 *
	 * **South**
	 *
	 * * `southArrowNorthWest`
	 *
	 * ```
	 *		[ Target ]
	 *		     ^
	 *		    +-----------------+
	 *		    |     Balloon     |
	 *		    +-----------------+
	 * ```
	 *
	 * * `southArrowNorthMiddleWest`
	 *
	 * ```
	 *		   [ Target ]
	 *		        ^
	 *		    +-----------------+
	 *		    |     Balloon     |
	 *		    +-----------------+
	 * ```
	 *
	 * * `southArrowNorth`
	 *
	 * ```
	 *		    [ Target ]
	 *		         ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southArrowNorthMiddleEast`
	 *
	 * ```
	 *		            [ Target ]
	 *		                 ^
	 *		   +-----------------+
	 *		   |     Balloon     |
	 *		   +-----------------+
	 * ```
	 *
	 * * `southArrowNorthEast`
	 *
	 * ```
	 *		            [ Target ]
	 *		                 ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * **South west**
	 *
	 * * `southWestArrowNorthWest`
	 *
	 *
	 * ```
	 *		 [ Target ]
	 *		 ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southWestArrowNorthMiddleWest`
	 *
	 * ```
	 *		     [ Target ]
	 *		     ^
	 *		 +-----------------+
	 *		 |     Balloon     |
	 *		 +-----------------+
	 * ```
	 *
	 * * `southWestArrowNorth`
	 *
	 * ```
	 *		         [ Target ]
	 *		         ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southWestArrowNorthMiddleEast`
	 *
	 * ```
	 *		              [ Target ]
	 *		              ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southWestArrowNorthEast`
	 *
	 * ```
	 *		                 [ Target ]
	 *		                 ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * **South east**
	 *
	 * * `southEastArrowNorthWest`
	 *
	 * ```
	 *		[ Target ]
	 *		         ^
	 *		        +-----------------+
	 *		        |     Balloon     |
	 *		        +-----------------+
	 * ```
	 *
	 * * `southEastArrowNorthMiddleWest`
	 *
	 * ```
	 *		   [ Target ]
	 *		            ^
	 *		        +-----------------+
	 *		        |     Balloon     |
	 *		        +-----------------+
	 * ```
	 *
	 * * `southEastArrowNorth`
	 *
	 * ```
	 *		[ Target ]
	 *		         ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southEastArrowNorthMiddleEast`
	 *
	 * ```
	 *		     [ Target ]
	 *		              ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * * `southEastArrowNorthEast`
	 *
	 * ```
	 *		        [ Target ]
	 *		                 ^
	 *		+-----------------+
	 *		|     Balloon     |
	 *		+-----------------+
	 * ```
	 *
	 * **West**
	 *
	 * * `westArrowEast`
	 *
	 * ```
	 *		+-----------------+
	 *		|     Balloon     |>[ Target ]
	 *		+-----------------+
	 * ```
	 *
	 * **East**
	 *
	 * * `eastArrowWest`
	 *
	 * ```
	 *		           +-----------------+
	 *		[ Target ]<|     Balloon     |
	 *		           +-----------------+
	 * ```
	 *
	 * **Sticky**
	 *
	 * * `viewportStickyNorth`
	 *
	 * ```
	 *		    +---------------------------+
	 *		    |        [ Target ]         |
	 *		    |                           |
	 *		+-----------------------------------+
	 *		|   |    +-----------------+    |   |
	 *		|   |    |     Balloon     |    |   |
	 *		|   |    +-----------------+    |   |
	 *		|   |                           |   |
	 *		|   |                           |   |
	 *		|   |                           |   |
	 *		|   |                           |   |
	 *		|   +---------------------------+   |
	 *		|             Viewport              |
	 *		+-----------------------------------+
	 * ```
	 *
	 * See {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView#attachTo}.
	 *
	 * Positioning functions must be compatible with {@link module:utils/dom/position~DomPoint}.
	 *
	 * Default positioning functions with customized offsets can be generated using
	 * {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView.generatePositions}.
	 *
	 * The name that the position function returns will be reflected in the balloon panel's class that
	 * controls the placement of the "arrow". See {@link #position} to learn more.
	 */ static defaultPositions = /* #__PURE__ */ BalloonPanelView.generatePositions();
}
/**
 * Returns the DOM element for given object or null, if there is none,
 * e.g. when the passed object is a Rect instance or so.
 */ function getDomElement(object) {
    if (isElement(object)) {
        return object;
    }
    if (isRange(object)) {
        return object.commonAncestorContainer;
    }
    if (typeof object == 'function') {
        return getDomElement(object());
    }
    return null;
}

const BALLOON_CLASS = 'ck-tooltip';
/**
 * A tooltip manager class for the UI of the editor.
 *
 * **Note**: Most likely you do not have to use the `TooltipManager` API listed below in order to display tooltips. Popular
 * {@glink framework/architecture/ui-library UI components} support tooltips out-of-the-box via observable properties
 * (see {@link module:ui/button/buttonview~ButtonView#tooltip} and {@link module:ui/button/buttonview~ButtonView#tooltipPosition}).
 *
 * # Displaying tooltips
 *
 * To display a tooltip, set `data-cke-tooltip-text` attribute on any DOM element:
 *
 * ```ts
 * domElement.dataset.ckeTooltipText = 'My tooltip';
 * ```
 *
 * The tooltip will show up whenever the user moves the mouse over the element or the element gets focus in DOM.
 *
 * # Positioning tooltips
 *
 * To change the position of the tooltip, use the `data-cke-tooltip-position` attribute (`s`, `se`, `sw`, `n`, `e`, or `w`):
 *
 * ```ts
 * domElement.dataset.ckeTooltipText = 'Tooltip to the north';
 * domElement.dataset.ckeTooltipPosition = 'n';
 * ```
 *
 * # Disabling tooltips
 *
 * In order to disable the tooltip  temporarily, use the `data-cke-tooltip-disabled` attribute:
 *
 * ```ts
 * domElement.dataset.ckeTooltipText = 'Disabled. For now.';
 * domElement.dataset.ckeTooltipDisabled = 'true';
 * ```
 *
 * # Styling tooltips
 *
 * By default, the tooltip has `.ck-tooltip` class and its text inner `.ck-tooltip__text`.
 *
 * If your tooltip requires custom styling, using `data-cke-tooltip-class` attribute will add additional class to the balloon
 * displaying the tooltip:
 *
 * ```ts
 * domElement.dataset.ckeTooltipText = 'Tooltip with a red text';
 * domElement.dataset.ckeTooltipClass = 'my-class';
 * ```
 *
 * ```css
 * .ck.ck-tooltip.my-class { color: red }
 * ```
 *
 * **Note**: This class is a singleton. All editor instances re-use the same instance loaded by
 * {@link module:ui/editorui/editorui~EditorUI} of the first editor.
 */ class TooltipManager extends /* #__PURE__ */ DomEmitterMixin() {
    /**
	 * The view rendering text of the tooltip.
	 */ tooltipTextView;
    /**
	 * The instance of the balloon panel that renders and positions the tooltip.
	 */ balloonPanelView;
    /**
	 * A set of default {@link module:utils/dom/position~PositioningFunction positioning functions} used by the `TooltipManager`
	 * to pin tooltips in different positions.
	 */ static defaultBalloonPositions = /* #__PURE__ */ BalloonPanelView.generatePositions({
        heightOffset: 5,
        sideOffset: 13
    });
    /**
	 * Stores the reference to the DOM element the tooltip is attached to. `null` when there's no tooltip
	 * in the UI.
	 */ _currentElementWithTooltip = null;
    /**
	 * Stores the current tooltip position. `null` when there's no tooltip in the UI.
	 */ _currentTooltipPosition = null;
    /**
	 * An instance of the resize observer that keeps track on target element visibility,
	 * when it hides the tooltip should also disappear.
	 *
	 * {@link module:core/editor/editorconfig~EditorConfig#balloonToolbar configuration}.
	 */ _resizeObserver = null;
    /**
	 * An instance of the mutation observer that keeps track on target element attributes changes.
	 */ _mutationObserver = null;
    /**
	 * A debounced version of {@link #_pinTooltip}. Tooltips show with a delay to avoid flashing and
	 * to improve the UX.
	 */ _pinTooltipDebounced;
    /**
	 * A debounced version of {@link #_unpinTooltip}. Tooltips hide with a delay to allow hovering of their titles.
	 */ _unpinTooltipDebounced;
    _watchdogExcluded;
    /**
	 * A set of editors the single tooltip manager instance must listen to.
	 * This is mostly to handle `EditorUI#update` listeners from individual editors.
	 */ static _editors = new Set();
    /**
	 * A reference to the `TooltipManager` instance. The class is a singleton and as such,
	 * successive attempts at creating instances should return this instance.
	 */ static _instance = null;
    /**
	 * Creates an instance of the tooltip manager.
	 */ constructor(editor){
        super();
        TooltipManager._editors.add(editor);
        // TooltipManager must be a singleton. Multiple instances would mean multiple tooltips attached
        // to the same DOM element with data-cke-tooltip-* attributes.
        if (TooltipManager._instance) {
            return TooltipManager._instance;
        }
        TooltipManager._instance = this;
        this.tooltipTextView = new View(editor.locale);
        this.tooltipTextView.set('text', '');
        this.tooltipTextView.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-tooltip__text'
                ]
            },
            children: [
                {
                    text: this.tooltipTextView.bindTemplate.to('text')
                }
            ]
        });
        this.balloonPanelView = new BalloonPanelView(editor.locale);
        this.balloonPanelView.class = BALLOON_CLASS;
        this.balloonPanelView.content.add(this.tooltipTextView);
        this._mutationObserver = createMutationObserver(()=>{
            this._updateTooltipPosition();
        });
        this._pinTooltipDebounced = debounce(this._pinTooltip, 600);
        this._unpinTooltipDebounced = debounce(this._unpinTooltip, 400);
        this.listenTo(global.document, 'keydown', this._onKeyDown.bind(this), {
            useCapture: true
        });
        this.listenTo(global.document, 'mouseenter', this._onEnterOrFocus.bind(this), {
            useCapture: true
        });
        this.listenTo(global.document, 'mouseleave', this._onLeaveOrBlur.bind(this), {
            useCapture: true
        });
        this.listenTo(global.document, 'focus', this._onEnterOrFocus.bind(this), {
            useCapture: true
        });
        this.listenTo(global.document, 'blur', this._onLeaveOrBlur.bind(this), {
            useCapture: true
        });
        this.listenTo(global.document, 'scroll', this._onScroll.bind(this), {
            useCapture: true
        });
        // Because this class is a singleton, its only instance is shared across all editors and connects them through the reference.
        // This causes issues with the ContextWatchdog. When an error is thrown in one editor, the watchdog traverses the references
        // and (because of shared tooltip manager) figures that the error affects all editors and restarts them all.
        // This flag, excludes tooltip manager instance from the traversal and brings ContextWatchdog back to normal.
        // More in https://github.com/ckeditor/ckeditor5/issues/12292.
        this._watchdogExcluded = true;
    }
    /**
	 * Destroys the tooltip manager.
	 *
	 * **Note**: The manager singleton cannot be destroyed until all editors that use it are destroyed.
	 *
	 * @param editor The editor the manager was created for.
	 */ destroy(editor) {
        const editorBodyViewCollection = editor.ui.view && editor.ui.view.body;
        TooltipManager._editors.delete(editor);
        this.stopListening(editor.ui);
        // Prevent the balloon panel from being destroyed in the EditorUI#destroy() cascade. It should be destroyed along
        // with the last editor only (https://github.com/ckeditor/ckeditor5/issues/12602).
        if (editorBodyViewCollection && editorBodyViewCollection.has(this.balloonPanelView)) {
            editorBodyViewCollection.remove(this.balloonPanelView);
        }
        if (!TooltipManager._editors.size) {
            this._unpinTooltip();
            this.balloonPanelView.destroy();
            this.stopListening();
            TooltipManager._instance = null;
        }
    }
    /**
	 * Returns {@link #balloonPanelView} {@link module:utils/dom/position~PositioningFunction positioning functions} for a given position
	 * name.
	 *
	 * @param position Name of the position (`s`, `se`, `sw`, `n`, `e`, or `w`).
	 * @returns Positioning functions to be used by the {@link #balloonPanelView}.
	 */ static getPositioningFunctions(position) {
        const defaultPositions = TooltipManager.defaultBalloonPositions;
        return ({
            // South is most popular. We can use positioning heuristics to avoid clipping by the viewport with the sane fallback.
            s: [
                defaultPositions.southArrowNorth,
                defaultPositions.southArrowNorthEast,
                defaultPositions.southArrowNorthWest
            ],
            n: [
                defaultPositions.northArrowSouth
            ],
            e: [
                defaultPositions.eastArrowWest
            ],
            w: [
                defaultPositions.westArrowEast
            ],
            sw: [
                defaultPositions.southArrowNorthEast
            ],
            se: [
                defaultPositions.southArrowNorthWest
            ]
        })[position];
    }
    /**
	 * Handles hiding tooltips on `keydown` in DOM.
	 *
	 * @param evt An object containing information about the fired event.
	 * @param domEvent The DOM event.
	 */ _onKeyDown(evt, domEvent) {
        if (domEvent.key === 'Escape' && this._currentElementWithTooltip) {
            this._unpinTooltip();
            domEvent.stopPropagation();
        }
    }
    /**
	 * Handles displaying tooltips on `mouseenter` and `focus` in DOM.
	 *
	 * @param evt An object containing information about the fired event.
	 * @param domEvent The DOM event.
	 */ _onEnterOrFocus(evt, { target }) {
        const elementWithTooltipAttribute = getDescendantWithTooltip(target);
        // Abort when there's no descendant needing tooltip.
        if (!elementWithTooltipAttribute) {
            // Unpin if element is focused, regardless of whether it contains a label or not.
            // It also prevents tooltips from overlapping the menu bar
            if (evt.name === 'focus') {
                this._unpinTooltip();
            }
            return;
        }
        // Abort to avoid flashing when, for instance:
        // * a tooltip is displayed for a focused element, then the same element gets mouseentered,
        // * a tooltip is displayed for an element via mouseenter, then the focus moves to the same element.
        if (elementWithTooltipAttribute === this._currentElementWithTooltip) {
            return;
        }
        this._unpinTooltip();
        // The tooltip should be pinned immediately when the element gets focused using keyboard.
        // If it is focused using the mouse, the tooltip should be pinned after a delay to prevent flashing.
        // See https://github.com/ckeditor/ckeditor5/issues/16383
        if (evt.name === 'focus' && !elementWithTooltipAttribute.matches(':hover')) {
            this._pinTooltip(elementWithTooltipAttribute, getTooltipData(elementWithTooltipAttribute));
        } else {
            this._pinTooltipDebounced(elementWithTooltipAttribute, getTooltipData(elementWithTooltipAttribute));
        }
    }
    /**
	 * Handles hiding tooltips on `mouseleave` and `blur` in DOM.
	 *
	 * @param evt An object containing information about the fired event.
	 * @param domEvent The DOM event.
	 */ _onLeaveOrBlur(evt, { target, relatedTarget }) {
        if (evt.name === 'mouseleave') {
            // Don't act when the event does not concern a DOM element (e.g. a mouseleave out of an entire document),
            if (!isElement(target)) {
                return;
            }
            const balloonElement = this.balloonPanelView.element;
            const isEnteringBalloon = balloonElement && (balloonElement === relatedTarget || balloonElement.contains(relatedTarget));
            const isLeavingBalloon = !isEnteringBalloon && target === balloonElement;
            // Do not hide the tooltip when the user moves the cursor over it.
            if (isEnteringBalloon) {
                this._unpinTooltipDebounced.cancel();
                return;
            }
            // If a tooltip is currently visible, don't act for a targets other than the one it is attached to.
            // The only exception is leaving balloon, in this scenario tooltip should be closed.
            // For instance, a random mouseleave far away in the page should not unpin the tooltip that was pinned because
            // of a previous focus. Only leaving the same element should hide the tooltip.
            if (!isLeavingBalloon && this._currentElementWithTooltip && target !== this._currentElementWithTooltip) {
                return;
            }
            const descendantWithTooltip = getDescendantWithTooltip(target);
            const relatedDescendantWithTooltip = getDescendantWithTooltip(relatedTarget);
            // Unpin when the mouse was leaving element with a tooltip to a place which does not have or has a different tooltip.
            // Note that this should happen whether the tooltip is already visible or not, for instance,
            // it could be invisible but queued (debounced): it should get canceled.
            if (isLeavingBalloon || descendantWithTooltip && descendantWithTooltip !== relatedDescendantWithTooltip) {
                this._unpinTooltipDebounced();
            }
        } else {
            // If a tooltip is currently visible, don't act for a targets other than the one it is attached to.
            // For instance, a random blur in the web page should not unpin the tooltip that was pinned because of a previous mouseenter.
            if (this._currentElementWithTooltip && target !== this._currentElementWithTooltip) {
                return;
            }
            // Note that unpinning should happen whether the tooltip is already visible or not, for instance, it could be invisible but
            // queued (debounced): it should get canceled (e.g. quick focus then quick blur using the keyboard).
            this._unpinTooltipDebounced();
        }
    }
    /**
	 * Handles hiding tooltips on `scroll` in DOM.
	 *
	 * @param evt An object containing information about the fired event.
	 * @param domEvent The DOM event.
	 */ _onScroll(evt, { target }) {
        // No tooltip, no reason to react on scroll.
        if (!this._currentElementWithTooltip) {
            return;
        }
        // When scrolling a container that has both the balloon and the current element (common ancestor), the balloon can remain
        // visible (e.g. scrolling ≤body>). Otherwise, to avoid glitches (clipping, lagging) better just hide the tooltip.
        // Also, don't do anything when scrolling an unrelated DOM element that has nothing to do with the current element and the balloon.
        if (target.contains(this.balloonPanelView.element) && target.contains(this._currentElementWithTooltip)) {
            return;
        }
        this._unpinTooltip();
    }
    /**
	 * Pins the tooltip to a specific DOM element.
	 *
	 * @param options.text Text of the tooltip to display.
	 * @param options.position The position of the tooltip.
	 * @param options.cssClass Additional CSS class of the balloon with the tooltip.
	 */ _pinTooltip(targetDomElement, { text, position, cssClass }) {
        this._unpinTooltip();
        // Use the body collection of the first editor.
        const bodyViewCollection = first(TooltipManager._editors.values()).ui.view.body;
        if (!bodyViewCollection.has(this.balloonPanelView)) {
            bodyViewCollection.add(this.balloonPanelView);
        }
        this.tooltipTextView.text = text;
        this.balloonPanelView.class = [
            BALLOON_CLASS,
            cssClass
        ].filter((className)=>className).join(' ');
        // Ensure that all changes to the tooltip are set before pinning it.
        // Setting class or text after pinning can cause the tooltip to be pinned in the wrong position.
        // It happens especially often when tooltip has class modified (like adding `ck-tooltip_multi-line`).
        // See https://github.com/ckeditor/ckeditor5/issues/16365
        this.balloonPanelView.pin({
            target: targetDomElement,
            positions: TooltipManager.getPositioningFunctions(position)
        });
        this._resizeObserver = new ResizeObserver(targetDomElement, ()=>{
            // The ResizeObserver will call its callback when the target element hides and the tooltip
            // should also disappear (https://github.com/ckeditor/ckeditor5/issues/12492).
            if (!isVisible(targetDomElement)) {
                this._unpinTooltip();
            }
        });
        this._mutationObserver.attach(targetDomElement);
        // Start responding to changes in editor UI or content layout. For instance, when collaborators change content
        // and a contextual toolbar attached to a content starts to move (and so should move the tooltip).
        // Note: Using low priority to let other listeners that position contextual toolbars etc. to react first.
        for (const editor of TooltipManager._editors){
            this.listenTo(editor.ui, 'update', this._updateTooltipPosition.bind(this), {
                priority: 'low'
            });
        }
        this._currentElementWithTooltip = targetDomElement;
        this._currentTooltipPosition = position;
    }
    /**
	 * Unpins the tooltip and cancels all queued pinning.
	 */ _unpinTooltip() {
        this._unpinTooltipDebounced.cancel();
        this._pinTooltipDebounced.cancel();
        this.balloonPanelView.unpin();
        for (const editor of TooltipManager._editors){
            this.stopListening(editor.ui, 'update');
        }
        this._currentElementWithTooltip = null;
        this._currentTooltipPosition = null;
        this.tooltipTextView.text = '';
        if (this._resizeObserver) {
            this._resizeObserver.destroy();
        }
        this._mutationObserver.detach();
    }
    /**
	 * Updates the position of the tooltip so it stays in sync with the element it is pinned to.
	 *
	 * Hides the tooltip when the element is no longer visible in DOM or the tooltip text was removed.
	 */ _updateTooltipPosition() {
        // The tooltip might get removed by focus listener triggered by the same UI `update` event.
        // See https://github.com/ckeditor/ckeditor5/pull/16363.
        if (!this._currentElementWithTooltip) {
            return;
        }
        const tooltipData = getTooltipData(this._currentElementWithTooltip);
        // This could happen if the tooltip was attached somewhere in a contextual content toolbar and the toolbar
        // disappeared (e.g. removed an image), or the tooltip text was removed.
        if (!isVisible(this._currentElementWithTooltip) || !tooltipData.text) {
            this._unpinTooltip();
            return;
        }
        this.balloonPanelView.pin({
            target: this._currentElementWithTooltip,
            positions: TooltipManager.getPositioningFunctions(tooltipData.position)
        });
    }
}
function getDescendantWithTooltip(element) {
    if (!isElement(element)) {
        return null;
    }
    return element.closest('[data-cke-tooltip-text]:not([data-cke-tooltip-disabled])');
}
function getTooltipData(element) {
    return {
        text: element.dataset.ckeTooltipText,
        position: element.dataset.ckeTooltipPosition || 's',
        cssClass: element.dataset.ckeTooltipClass || ''
    };
}
// Creates a simple `MutationObserver` instance wrapper that observes changes in the tooltip-related attributes of the given element.
// Used instead of the `MutationObserver` from the engine for simplicity.
function createMutationObserver(callback) {
    const mutationObserver = new MutationObserver(()=>{
        callback();
    });
    return {
        attach (element) {
            mutationObserver.observe(element, {
                attributes: true,
                attributeFilter: [
                    'data-cke-tooltip-text',
                    'data-cke-tooltip-position'
                ]
            });
        },
        detach () {
            mutationObserver.disconnect();
        }
    };
}

var poweredByIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"53\" height=\"10\" viewBox=\"0 0 53 10\"><path fill=\"#1C2331\" d=\"M31.724 1.492a15.139 15.139 0 0 0 .045 1.16 2.434 2.434 0 0 0-.687-.34 3.68 3.68 0 0 0-1.103-.166 2.332 2.332 0 0 0-1.14.255 1.549 1.549 0 0 0-.686.87c-.15.41-.225.98-.225 1.712 0 .939.148 1.659.444 2.161.297.503.792.754 1.487.754.452.015.9-.094 1.294-.316.296-.174.557-.4.771-.669l.14.852h1.282V.007h-1.623v1.485ZM31 6.496a1.77 1.77 0 0 1-.494.061.964.964 0 0 1-.521-.127.758.758 0 0 1-.296-.466 3.984 3.984 0 0 1-.093-.992 4.208 4.208 0 0 1 .098-1.052.753.753 0 0 1 .307-.477 1.08 1.08 0 0 1 .55-.122c.233-.004.466.026.69.089l.483.144v2.553c-.11.076-.213.143-.307.2a1.73 1.73 0 0 1-.417.189ZM35.68 0l-.702.004c-.322.002-.482.168-.48.497l.004.581c.002.33.164.493.486.49l.702-.004c.322-.002.481-.167.48-.496L36.165.49c-.002-.33-.164-.493-.486-.491ZM36.145 2.313l-1.612.01.034 5.482 1.613-.01-.035-5.482ZM39.623.79 37.989.8 38 2.306l-.946.056.006 1.009.949-.006.024 2.983c.003.476.143.844.419 1.106.275.26.658.39 1.148.387.132 0 .293-.01.483-.03.19-.02.38-.046.57-.08.163-.028.324-.068.482-.119l-.183-1.095-.702.004a.664.664 0 0 1-.456-.123.553.553 0 0 1-.14-.422l-.016-2.621 1.513-.01-.006-1.064-1.514.01-.01-1.503ZM46.226 2.388c-.41-.184-.956-.274-1.636-.27-.673.004-1.215.101-1.627.29-.402.179-.72.505-.888.91-.18.419-.268.979-.264 1.68.004.688.1 1.24.285 1.655.172.404.495.724.9.894.414.18.957.268 1.63.264.68-.004 1.224-.099 1.632-.284.4-.176.714-.501.878-.905.176-.418.263-.971.258-1.658-.004-.702-.097-1.261-.28-1.677a1.696 1.696 0 0 0-.888-.9Zm-.613 3.607a.77.77 0 0 1-.337.501 1.649 1.649 0 0 1-1.317.009.776.776 0 0 1-.343-.497 4.066 4.066 0 0 1-.105-1.02 4.136 4.136 0 0 1 .092-1.03.786.786 0 0 1 .337-.507 1.59 1.59 0 0 1 1.316-.008.79.79 0 0 1 .344.502c.078.337.113.683.105 1.03.012.343-.019.685-.092 1.02ZM52.114 2.07a2.67 2.67 0 0 0-1.128.278c-.39.191-.752.437-1.072.73l-.157-.846-1.273.008.036 5.572 1.623-.01-.024-3.78c.35-.124.646-.22.887-.286.26-.075.53-.114.8-.118l.45-.003.144-1.546-.286.001ZM22.083 7.426l-1.576-2.532a2.137 2.137 0 0 0-.172-.253 1.95 1.95 0 0 0-.304-.29.138.138 0 0 1 .042-.04 1.7 1.7 0 0 0 .328-.374l1.75-2.71c.01-.015.025-.028.024-.048-.01-.01-.021-.007-.031-.007L20.49 1.17a.078.078 0 0 0-.075.045l-.868 1.384c-.23.366-.46.732-.688 1.099a.108.108 0 0 1-.112.06c-.098-.005-.196-.001-.294-.002-.018 0-.038.006-.055-.007.002-.02.002-.039.005-.058a4.6 4.6 0 0 0 .046-.701V1.203c0-.02-.009-.032-.03-.03h-.033L16.93 1.17c-.084 0-.073-.01-.073.076v6.491c-.001.018.006.028.025.027h1.494c.083 0 .072.007.072-.071v-2.19c0-.055-.003-.11-.004-.166a3.366 3.366 0 0 0-.05-.417h.06c.104 0 .209.002.313-.002a.082.082 0 0 1 .084.05c.535.913 1.07 1.824 1.607 2.736a.104.104 0 0 0 .103.062c.554-.003 1.107-.002 1.66-.002l.069-.003-.019-.032-.188-.304ZM27.112 6.555c-.005-.08-.004-.08-.082-.08h-2.414c-.053 0-.106-.003-.159-.011a.279.279 0 0 1-.246-.209.558.558 0 0 1-.022-.15c0-.382 0-.762-.002-1.143 0-.032.007-.049.042-.044h2.504c.029.003.037-.012.034-.038V3.814c0-.089.013-.078-.076-.078h-2.44c-.07 0-.062.003-.062-.06v-.837c0-.047.004-.093.013-.14a.283.283 0 0 1 .241-.246.717.717 0 0 1 .146-.011h2.484c.024.002.035-.009.036-.033l.003-.038.03-.496c.01-.183.024-.365.034-.548.005-.085.003-.087-.082-.094-.218-.018-.437-.038-.655-.05a17.845 17.845 0 0 0-.657-.026 72.994 72.994 0 0 0-1.756-.016 1.7 1.7 0 0 0-.471.064 1.286 1.286 0 0 0-.817.655c-.099.196-.149.413-.145.633v3.875c0 .072.003.144.011.216a1.27 1.27 0 0 0 .711 1.029c.228.113.48.167.734.158.757-.005 1.515.002 2.272-.042.274-.016.548-.034.82-.053.03-.002.043-.008.04-.041-.008-.104-.012-.208-.019-.312a69.964 69.964 0 0 1-.05-.768ZM16.14 7.415l-.127-1.075c-.004-.03-.014-.04-.044-.037a13.125 13.125 0 0 1-.998.073c-.336.01-.672.02-1.008.016-.116-.001-.233-.014-.347-.039a.746.746 0 0 1-.45-.262c-.075-.1-.132-.211-.167-.33a3.324 3.324 0 0 1-.126-.773 9.113 9.113 0 0 1-.015-.749c0-.285.022-.57.065-.852.023-.158.066-.312.127-.46a.728.728 0 0 1 .518-.443 1.64 1.64 0 0 1 .397-.048c.628-.001 1.255.003 1.882.05.022.001.033-.006.036-.026l.003-.031.06-.55c.019-.177.036-.355.057-.532.004-.034-.005-.046-.04-.056a5.595 5.595 0 0 0-1.213-.21 10.783 10.783 0 0 0-.708-.02c-.24-.003-.48.01-.719.041a3.477 3.477 0 0 0-.625.14 1.912 1.912 0 0 0-.807.497c-.185.2-.33.433-.424.688a4.311 4.311 0 0 0-.24 1.096c-.031.286-.045.572-.042.86-.006.43.024.86.091 1.286.04.25.104.497.193.734.098.279.26.53.473.734.214.205.473.358.756.446.344.11.702.17 1.063.177a8.505 8.505 0 0 0 1.578-.083 6.11 6.11 0 0 0 .766-.18c.03-.008.047-.023.037-.057a.157.157 0 0 1-.003-.025Z\"/><path fill=\"#AFE229\" d=\"M6.016 6.69a1.592 1.592 0 0 0-.614.21c-.23.132-.422.32-.56.546-.044.072-.287.539-.287.539l-.836 1.528.009.006c.038.025.08.046.123.063.127.046.26.07.395.073.505.023 1.011-.007 1.517-.003.29.009.58.002.869-.022a.886.886 0 0 0 .395-.116.962.962 0 0 0 .312-.286c.056-.083.114-.163.164-.249.24-.408.48-.816.718-1.226.075-.128.148-.257.222-.386l.112-.192a1.07 1.07 0 0 0 .153-.518l-1.304.023s-1.258-.005-1.388.01Z\"/><path fill=\"#771BFF\" d=\"m2.848 9.044.76-1.39.184-.352c-.124-.067-.245-.14-.367-.21-.346-.204-.706-.384-1.045-.6a.984.984 0 0 1-.244-.207c-.108-.134-.136-.294-.144-.46-.021-.409-.002-.818-.009-1.227-.003-.195 0-.39.003-.585.004-.322.153-.553.427-.713l.833-.488c.22-.13.44-.257.662-.385.05-.029.105-.052.158-.077.272-.128.519-.047.76.085l.044.028c.123.06.242.125.358.196.318.178.635.357.952.537.095.056.187.117.275.184.194.144.254.35.266.578.016.284.007.569.006.853-.001.28.004.558 0 .838.592-.003 1.259 0 1.259 0l.723-.013c-.003-.292-.007-.584-.007-.876 0-.524.015-1.048-.016-1.571-.024-.42-.135-.8-.492-1.067a5.02 5.02 0 0 0-.506-.339A400.52 400.52 0 0 0 5.94.787C5.722.664 5.513.524 5.282.423 5.255.406 5.228.388 5.2.373 4.758.126 4.305-.026 3.807.21c-.097.046-.197.087-.29.14A699.896 699.896 0 0 0 .783 1.948c-.501.294-.773.717-.778 1.31-.004.36-.009.718-.001 1.077.016.754-.017 1.508.024 2.261.016.304.07.6.269.848.127.15.279.28.448.382.622.4 1.283.734 1.92 1.11l.183.109Z\"/></svg>\n";

const ICON_WIDTH = 53;
const ICON_HEIGHT = 10;
// ⚠ Note, whenever changing the threshold, make sure to update the docs/support/managing-ckeditor-logo.md docs
// as this information is also mentioned there ⚠.
const NARROW_ROOT_HEIGHT_THRESHOLD = 50;
const NARROW_ROOT_WIDTH_THRESHOLD = 350;
const DEFAULT_LABEL = 'Powered by';
/**
 * A helper that enables the "powered by" feature in the editor and renders a link to the project's
 * webpage next to the bottom of the editable element (editor root, source editing area, etc.) when the editor is focused.
 *
 * @private
 */ class PoweredBy extends /* #__PURE__ */ DomEmitterMixin() {
    /**
	 * Editor instance the helper was created for.
	 */ editor;
    /**
	 * A reference to the balloon panel hosting and positioning the "powered by" link and logo.
	 */ _balloonView;
    /**
	 * A throttled version of the {@link #_showBalloon} method meant for frequent use to avoid performance loss.
	 */ _showBalloonThrottled;
    /**
	 * A reference to the last editable element (root, source editing area, etc.) focused by the user.
	 * Since the focus can move to other focusable elements in the UI, this reference allows positioning the balloon over the
	 * right element whether the user is typing or using the UI.
	 */ _lastFocusedEditableElement;
    /**
	 * Creates a "powered by" helper for a given editor. The feature is initialized on Editor#ready
	 * event.
	 *
	 * @param editor
	 */ constructor(editor){
        super();
        this.editor = editor;
        this._balloonView = null;
        this._lastFocusedEditableElement = null;
        this._showBalloonThrottled = throttle(this._showBalloon.bind(this), 50, {
            leading: true
        });
        editor.on('ready', this._handleEditorReady.bind(this));
    }
    /**
	 * Destroys the "powered by" helper along with its view.
	 */ destroy() {
        const balloon = this._balloonView;
        if (balloon) {
            // Balloon gets destroyed by the body collection.
            // The powered by view gets destroyed by the balloon.
            balloon.unpin();
            this._balloonView = null;
        }
        this._showBalloonThrottled.cancel();
        this.stopListening();
    }
    /**
	 * Enables "powered by" label once the editor (ui) is ready.
	 */ _handleEditorReady() {
        const editor = this.editor;
        const forceVisible = !!editor.config.get('ui.poweredBy.forceVisible');
        /* istanbul ignore next -- @preserve */ if (!forceVisible && verifyLicense(editor.config.get('licenseKey')) === 'VALID') {
            return;
        }
        // No view means no body collection to append the powered by balloon to.
        if (!editor.ui.view) {
            return;
        }
        editor.ui.focusTracker.on('change:isFocused', (evt, data, isFocused)=>{
            this._updateLastFocusedEditableElement();
            if (isFocused) {
                this._showBalloon();
            } else {
                this._hideBalloon();
            }
        });
        editor.ui.focusTracker.on('change:focusedElement', (evt, data, focusedElement)=>{
            this._updateLastFocusedEditableElement();
            if (focusedElement) {
                this._showBalloon();
            }
        });
        editor.ui.on('update', ()=>{
            this._showBalloonThrottled();
        });
    }
    /**
	 * Creates an instance of the {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView balloon panel}
	 * with the "powered by" view inside ready for positioning.
	 */ _createBalloonView() {
        const editor = this.editor;
        const balloon = this._balloonView = new BalloonPanelView();
        const poweredByConfig = getNormalizedConfig(editor);
        const view = new PoweredByView(editor.locale, poweredByConfig.label);
        balloon.content.add(view);
        balloon.set({
            class: 'ck-powered-by-balloon'
        });
        editor.ui.view.body.add(balloon);
        editor.ui.focusTracker.add(balloon.element);
        this._balloonView = balloon;
    }
    /**
	 * Attempts to display the balloon with the "powered by" view.
	 */ _showBalloon() {
        if (!this._lastFocusedEditableElement) {
            return;
        }
        const attachOptions = getBalloonAttachOptions(this.editor, this._lastFocusedEditableElement);
        if (attachOptions) {
            if (!this._balloonView) {
                this._createBalloonView();
            }
            this._balloonView.pin(attachOptions);
        }
    }
    /**
	 * Hides the "powered by" balloon if already visible.
	 */ _hideBalloon() {
        if (this._balloonView) {
            this._balloonView.unpin();
        }
    }
    /**
	 * Updates the {@link #_lastFocusedEditableElement} based on the state of the global focus tracker.
	 */ _updateLastFocusedEditableElement() {
        const editor = this.editor;
        const isFocused = editor.ui.focusTracker.isFocused;
        const focusedElement = editor.ui.focusTracker.focusedElement;
        if (!isFocused || !focusedElement) {
            this._lastFocusedEditableElement = null;
            return;
        }
        const editableEditorElements = Array.from(editor.ui.getEditableElementsNames()).map((name)=>{
            return editor.ui.getEditableElement(name);
        });
        if (editableEditorElements.includes(focusedElement)) {
            this._lastFocusedEditableElement = focusedElement;
        } else {
            // If it's none of the editable element, then the focus is somewhere in the UI. Let's display powered by
            // over the first element then.
            this._lastFocusedEditableElement = editableEditorElements[0];
        }
    }
}
/**
 * A view displaying a "powered by" label and project logo wrapped in a link.
 */ class PoweredByView extends View {
    /**
	 * Created an instance of the "powered by" view.
	 *
	 * @param locale The localization services instance.
	 * @param label The label text.
	 */ constructor(locale, label){
        super(locale);
        const iconView = new IconView();
        const bind = this.bindTemplate;
        iconView.set({
            content: poweredByIcon,
            isColorInherited: false
        });
        iconView.extendTemplate({
            attributes: {
                style: {
                    width: ICON_WIDTH + 'px',
                    height: ICON_HEIGHT + 'px'
                }
            }
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-powered-by'
                ],
                'aria-hidden': true
            },
            children: [
                {
                    tag: 'a',
                    attributes: {
                        href: 'https://ckeditor.com/?utm_source=ckeditor&' + 'utm_medium=referral&utm_campaign=701Dn000000hVgmIAE_powered_by_ckeditor_logo',
                        target: '_blank',
                        tabindex: '-1'
                    },
                    children: [
                        ...label ? [
                            {
                                tag: 'span',
                                attributes: {
                                    class: [
                                        'ck',
                                        'ck-powered-by__label'
                                    ]
                                },
                                children: [
                                    label
                                ]
                            }
                        ] : [],
                        iconView
                    ],
                    on: {
                        dragstart: bind.to((evt)=>evt.preventDefault())
                    }
                }
            ]
        });
    }
}
function getBalloonAttachOptions(editor, focusedEditableElement) {
    const poweredByConfig = getNormalizedConfig(editor);
    const positioningFunction = poweredByConfig.side === 'right' ? getLowerRightCornerPosition(focusedEditableElement, poweredByConfig) : getLowerLeftCornerPosition(focusedEditableElement, poweredByConfig);
    return {
        target: focusedEditableElement,
        positions: [
            positioningFunction
        ]
    };
}
function getLowerRightCornerPosition(focusedEditableElement, config) {
    return getLowerCornerPosition(focusedEditableElement, config, (rootRect, balloonRect)=>{
        return rootRect.left + rootRect.width - balloonRect.width - config.horizontalOffset;
    });
}
function getLowerLeftCornerPosition(focusedEditableElement, config) {
    return getLowerCornerPosition(focusedEditableElement, config, (rootRect)=>rootRect.left + config.horizontalOffset);
}
function getLowerCornerPosition(focusedEditableElement, config, getBalloonLeft) {
    return (visibleEditableElementRect, balloonRect)=>{
        const editableElementRect = new Rect(focusedEditableElement);
        if (editableElementRect.width < NARROW_ROOT_WIDTH_THRESHOLD || editableElementRect.height < NARROW_ROOT_HEIGHT_THRESHOLD) {
            return null;
        }
        let balloonTop;
        if (config.position === 'inside') {
            balloonTop = editableElementRect.bottom - balloonRect.height;
        } else {
            balloonTop = editableElementRect.bottom - balloonRect.height / 2;
        }
        balloonTop -= config.verticalOffset;
        const balloonLeft = getBalloonLeft(editableElementRect, balloonRect);
        // Clone the editable element rect and place it where the balloon would be placed.
        // This will allow getVisible() to work from editable element's perspective (rect source).
        // and yield a result as if the balloon was on the same (scrollable) layer as the editable element.
        const newBalloonPositionRect = visibleEditableElementRect.clone().moveTo(balloonLeft, balloonTop).getIntersection(balloonRect.clone().moveTo(balloonLeft, balloonTop));
        const newBalloonPositionVisibleRect = newBalloonPositionRect.getVisible();
        if (!newBalloonPositionVisibleRect || newBalloonPositionVisibleRect.getArea() < balloonRect.getArea()) {
            return null;
        }
        return {
            top: balloonTop,
            left: balloonLeft,
            name: `position_${config.position}-side_${config.side}`,
            config: {
                withArrow: false
            }
        };
    };
}
function getNormalizedConfig(editor) {
    const userConfig = editor.config.get('ui.poweredBy');
    const position = userConfig && userConfig.position || 'border';
    return {
        position,
        label: DEFAULT_LABEL,
        verticalOffset: position === 'inside' ? 5 : 0,
        horizontalOffset: 5,
        side: editor.locale.contentLanguageDirection === 'ltr' ? 'right' : 'left',
        ...userConfig
    };
}

/**
 * The politeness level of an `aria-live` announcement.
 *
 * Available keys are:
 * * `AriaLiveAnnouncerPoliteness.POLITE`,
 * * `AriaLiveAnnouncerPoliteness.ASSERTIVE`
 *
 * [Learn more](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions#Politeness_levels).
 */ const AriaLiveAnnouncerPoliteness = {
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
};
/**
 * An accessibility helper that manages all ARIA live regions associated with an editor instance. ARIA live regions announce changes
 * to the state of the editor features.
 *
 * These announcements are consumed and propagated by screen readers and give users a better understanding of the current
 * state of the editor.
 *
 * To announce a state change to an editor use the {@link #announce} method:
 *
 * ```ts
 * editor.ui.ariaLiveAnnouncer.announce( 'Text of an announcement.' );
 * ```
 */ class AriaLiveAnnouncer {
    /**
	 * The editor instance.
	 */ editor;
    /**
	 * The view that aggregates all `aria-live` regions.
	 */ view;
    /**
	 * @inheritDoc
	 */ constructor(editor){
        this.editor = editor;
        /**
		 * Some screen readers only look at changes in the aria-live region.
		 * They might not read a region that already has content when it is added.
		 * To stop this problem, make sure to set up regions for all politeness settings when the editor starts.
		 */ editor.once('ready', ()=>{
            for (const politeness of Object.values(AriaLiveAnnouncerPoliteness)){
                this.announce('', politeness);
            }
        });
    }
    /**
	 * Sets an announcement text to an aria region that is then announced by a screen reader to the user.
	 *
	 * If the aria region of a specified politeness does not exist, it will be created and can be re-used later.
	 *
	 * The default announcement politeness level is `'polite'`.
	 *
	 * ```ts
	 * // Most screen readers will queue announcements from multiple aria-live regions and read them out in the order they were emitted.
 	 * editor.ui.ariaLiveAnnouncer.announce( 'Image uploaded.' );
 	 * editor.ui.ariaLiveAnnouncer.announce( 'Connection lost. Reconnecting.' );
 	 * ```
	 */ announce(announcement, attributes = AriaLiveAnnouncerPoliteness.POLITE) {
        const editor = this.editor;
        if (!editor.ui.view) {
            return;
        }
        if (!this.view) {
            this.view = new AriaLiveAnnouncerView(editor.locale);
            editor.ui.view.body.add(this.view);
        }
        const { politeness, isUnsafeHTML } = typeof attributes === 'string' ? {
            politeness: attributes
        } : attributes;
        let politenessRegionView = this.view.regionViews.find((view)=>view.politeness === politeness);
        if (!politenessRegionView) {
            politenessRegionView = new AriaLiveAnnouncerRegionView(editor, politeness);
            this.view.regionViews.add(politenessRegionView);
        }
        politenessRegionView.announce({
            announcement,
            isUnsafeHTML
        });
    }
}
/**
 * The view that aggregates all `aria-live` regions.
 */ class AriaLiveAnnouncerView extends View {
    /**
	 * A collection of all views that represent individual `aria-live` regions.
	 */ regionViews;
    constructor(locale){
        super(locale);
        this.regionViews = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-aria-live-announcer'
                ]
            },
            children: this.regionViews
        });
    }
}
/**
 * The view that represents a single `aria-live`.
 */ class AriaLiveAnnouncerRegionView extends View {
    /**
	 * Current politeness level of the region.
	 */ politeness;
    /**
	 * DOM converter used to sanitize unsafe HTML passed to {@link #announce} method.
	 */ _domConverter;
    /**
	 * Interval used to remove additions. It prevents accumulation of added nodes in region.
	 */ _pruneAnnouncementsInterval;
    constructor(editor, politeness){
        super(editor.locale);
        this.setTemplate({
            tag: 'div',
            attributes: {
                role: 'region',
                'aria-live': politeness,
                'aria-relevant': 'additions'
            },
            children: [
                {
                    tag: 'ul',
                    attributes: {
                        class: [
                            'ck',
                            'ck-aria-live-region-list'
                        ]
                    }
                }
            ]
        });
        editor.on('destroy', ()=>{
            if (this._pruneAnnouncementsInterval !== null) {
                clearInterval(this._pruneAnnouncementsInterval);
                this._pruneAnnouncementsInterval = null;
            }
        });
        this.politeness = politeness;
        this._domConverter = editor.data.htmlProcessor.domConverter;
        this._pruneAnnouncementsInterval = setInterval(()=>{
            if (this.element && this._listElement.firstChild) {
                this._listElement.firstChild.remove();
            }
        }, 5000);
    }
    /**
	 * Appends new announcement to region.
	 */ announce({ announcement, isUnsafeHTML }) {
        if (!announcement.trim().length) {
            return;
        }
        const messageListItem = document.createElement('li');
        if (isUnsafeHTML) {
            this._domConverter.setContentOf(messageListItem, announcement);
        } else {
            messageListItem.innerText = announcement;
        }
        this._listElement.appendChild(messageListItem);
    }
    /**
	 * Return current announcements list HTML element.
	 */ get _listElement() {
        return this.element.querySelector('ul');
    }
}

/**
 * A class providing the minimal interface that is required to successfully bootstrap any editor UI.
 */ class EditorUI extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * The editor that the UI belongs to.
	 */ editor;
    /**
	 * An instance of the {@link module:ui/componentfactory~ComponentFactory}, a registry used by plugins
	 * to register factories of specific UI components.
	 */ componentFactory;
    /**
	 * Stores the information about the editor UI focus and propagates it so various plugins and components
	 * are unified as a focus group.
	 */ focusTracker;
    /**
	 * Manages the tooltips displayed on mouseover and focus across the UI.
	 */ tooltipManager;
    /**
	 * A helper that enables the "powered by" feature in the editor and renders a link to the project's webpage.
	 */ poweredBy;
    /**
	 * A helper that manages the content of an `aria-live` regions used by editor features to announce status changes
	 * to screen readers.
	 */ ariaLiveAnnouncer;
    /**
	 * Indicates the UI is ready. Set `true` after {@link #event:ready} event is fired.
	 *
	 * @readonly
	 * @default false
	 */ isReady = false;
    /**
	 * Stores all editable elements used by the editor instance.
	 */ _editableElementsMap = new Map();
    /**
	 * All available & focusable toolbars.
	 */ _focusableToolbarDefinitions = [];
    /**
	 * Creates an instance of the editor UI class.
	 *
	 * @param editor The editor instance.
	 */ constructor(editor){
        super();
        const editingView = editor.editing.view;
        this.editor = editor;
        this.componentFactory = new ComponentFactory(editor);
        this.focusTracker = new FocusTracker();
        this.tooltipManager = new TooltipManager(editor);
        this.poweredBy = new PoweredBy(editor);
        this.ariaLiveAnnouncer = new AriaLiveAnnouncer(editor);
        this.set('viewportOffset', this._readViewportOffsetFromConfig());
        this.once('ready', ()=>{
            this.isReady = true;
        });
        // Informs UI components that should be refreshed after layout change.
        this.listenTo(editingView.document, 'layoutChanged', this.update.bind(this));
        this.listenTo(editingView, 'scrollToTheSelection', this._handleScrollToTheSelection.bind(this));
        this._initFocusTracking();
    }
    /**
	 * The main (outermost) DOM element of the editor UI.
	 *
	 * For example, in {@link module:editor-classic/classiceditor~ClassicEditor} it is a `<div>` which
	 * wraps the editable element and the toolbar. In {@link module:editor-inline/inlineeditor~InlineEditor}
	 * it is the editable element itself (as there is no other wrapper). However, in
	 * {@link module:editor-decoupled/decouplededitor~DecoupledEditor} it is set to `null` because this editor does not
	 * come with a single "main" HTML element (its editable element and toolbar are separate).
	 *
	 * This property can be understood as a shorthand for retrieving the element that a specific editor integration
	 * considers to be its main DOM element.
	 */ get element() {
        return null;
    }
    /**
	 * Fires the {@link module:ui/editorui/editorui~EditorUI#event:update `update`} event.
	 *
	 * This method should be called when the editor UI (e.g. positions of its balloons) needs to be updated due to
	 * some environmental change which CKEditor 5 is not aware of (e.g. resize of a container in which it is used).
	 */ update() {
        this.fire('update');
    }
    /**
	 * Destroys the UI.
	 */ destroy() {
        this.stopListening();
        this.focusTracker.destroy();
        this.tooltipManager.destroy(this.editor);
        this.poweredBy.destroy();
        // Clean–up the references to the CKEditor instance stored in the native editable DOM elements.
        for (const domElement of this._editableElementsMap.values()){
            domElement.ckeditorInstance = null;
            this.editor.keystrokes.stopListening(domElement);
        }
        this._editableElementsMap = new Map();
        this._focusableToolbarDefinitions = [];
    }
    /**
	 * Stores the native DOM editable element used by the editor under a unique name.
	 *
	 * Also, registers the element in the editor to maintain the accessibility of the UI. When the user is editing text in a focusable
	 * editable area, they can use the <kbd>Alt</kbd> + <kbd>F10</kbd> keystroke to navigate over editor toolbars. See {@link #addToolbar}.
	 *
	 * @param rootName The unique name of the editable element.
	 * @param domElement The native DOM editable element.
	 */ setEditableElement(rootName, domElement) {
        this._editableElementsMap.set(rootName, domElement);
        // Put a reference to the CKEditor instance in the editable native DOM element.
        // It helps 3rd–party software (browser extensions, other libraries) access and recognize
        // CKEditor 5 instances (editing roots) and use their API (there is no global editor
        // instance registry).
        if (!domElement.ckeditorInstance) {
            domElement.ckeditorInstance = this.editor;
        }
        // Register the element, so it becomes available for Alt+F10 and Esc navigation.
        this.focusTracker.add(domElement);
        const setUpKeystrokeHandler = ()=>{
            // The editing view of the editor is already listening to keystrokes from DOM roots (see: KeyObserver).
            // Do not duplicate listeners.
            if (this.editor.editing.view.getDomRoot(rootName)) {
                return;
            }
            this.editor.keystrokes.listenTo(domElement);
        };
        // For editable elements set by features after EditorUI is ready (e.g. source editing).
        if (this.isReady) {
            setUpKeystrokeHandler();
        } else {
            this.once('ready', setUpKeystrokeHandler);
        }
    }
    /**
	 * Removes the editable from the editor UI. Removes all handlers added by {@link #setEditableElement}.
	 *
	 * @param rootName The name of the editable element to remove.
	 */ removeEditableElement(rootName) {
        const domElement = this._editableElementsMap.get(rootName);
        if (!domElement) {
            return;
        }
        this._editableElementsMap.delete(rootName);
        this.editor.keystrokes.stopListening(domElement);
        this.focusTracker.remove(domElement);
        domElement.ckeditorInstance = null;
    }
    /**
	 * Returns the editable editor element with the given name or null if editable does not exist.
	 *
	 * @param rootName The editable name.
	 */ getEditableElement(rootName = 'main') {
        return this._editableElementsMap.get(rootName);
    }
    /**
	 * Returns array of names of all editor editable elements.
	 */ getEditableElementsNames() {
        return this._editableElementsMap.keys();
    }
    /**
	 * Adds a toolbar to the editor UI. Used primarily to maintain the accessibility of the UI.
	 *
	 * Focusable toolbars can be accessed (focused) by users by pressing the <kbd>Alt</kbd> + <kbd>F10</kbd> keystroke.
	 * Successive keystroke presses navigate over available toolbars.
	 *
	 * @param toolbarView A instance of the toolbar to be registered.
	 */ addToolbar(toolbarView, options = {}) {
        if (toolbarView.isRendered) {
            this.focusTracker.add(toolbarView.element);
            this.editor.keystrokes.listenTo(toolbarView.element);
        } else {
            toolbarView.once('render', ()=>{
                this.focusTracker.add(toolbarView.element);
                this.editor.keystrokes.listenTo(toolbarView.element);
            });
        }
        this._focusableToolbarDefinitions.push({
            toolbarView,
            options
        });
    }
    /**
	 * Stores all editable elements used by the editor instance.
	 *
	 * @deprecated
	 */ get _editableElements() {
        /**
		 * The {@link module:ui/editorui/editorui~EditorUI#_editableElements `EditorUI#_editableElements`} property has been
		 * deprecated and will be removed in the near future. Please use
		 * {@link module:ui/editorui/editorui~EditorUI#setEditableElement `setEditableElement()`} and
		 * {@link module:ui/editorui/editorui~EditorUI#getEditableElement `getEditableElement()`} methods instead.
		 *
		 * @error editor-ui-deprecated-editable-elements
		 * @param editorUI Editor UI instance the deprecated property belongs to.
		 */ console.warn('editor-ui-deprecated-editable-elements: ' + 'The EditorUI#_editableElements property has been deprecated and will be removed in the near future.', {
            editorUI: this
        });
        return this._editableElementsMap;
    }
    /**
	 * Returns viewport offsets object:
	 *
	 * ```js
	 * {
	 * 	top: Number,
	 * 	right: Number,
	 * 	bottom: Number,
	 * 	left: Number
	 * }
	 * ```
	 *
	 * Only top property is currently supported.
	 */ _readViewportOffsetFromConfig() {
        const editor = this.editor;
        const viewportOffsetConfig = editor.config.get('ui.viewportOffset');
        if (viewportOffsetConfig) {
            return viewportOffsetConfig;
        }
        // Not present in EditorConfig type, because it's legacy. Hence the `as` expression.
        const legacyOffsetConfig = editor.config.get('toolbar.viewportTopOffset');
        // Fall back to deprecated toolbar config.
        if (legacyOffsetConfig) {
            /**
			 * The {@link module:core/editor/editorconfig~EditorConfig#toolbar `EditorConfig#toolbar.viewportTopOffset`}
			 * property has been deprecated and will be removed in the near future. Please use
			 * {@link module:core/editor/editorconfig~EditorConfig#ui `EditorConfig#ui.viewportOffset`} instead.
			 *
			 * @error editor-ui-deprecated-viewport-offset-config
			 */ console.warn('editor-ui-deprecated-viewport-offset-config: ' + 'The `toolbar.vieportTopOffset` configuration option is deprecated. ' + 'It will be removed from future CKEditor versions. Use `ui.viewportOffset.top` instead.');
            return {
                top: legacyOffsetConfig
            };
        }
        // More keys to come in the future.
        return {
            top: 0
        };
    }
    /**
	 * Starts listening for <kbd>Alt</kbd> + <kbd>F10</kbd> and <kbd>Esc</kbd> keystrokes in the context of focusable
	 * {@link #setEditableElement editable elements} and {@link #addToolbar toolbars}
	 * to allow users navigate across the UI.
	 */ _initFocusTracking() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        let lastFocusedForeignElement;
        let candidateDefinitions;
        // Focus the next focusable toolbar on <kbd>Alt</kbd> + <kbd>F10</kbd>.
        editor.keystrokes.set('Alt+F10', (data, cancel)=>{
            const focusedElement = this.focusTracker.focusedElement;
            // Focus moved out of a DOM element that
            // * is not a toolbar,
            // * does not belong to the editing view (e.g. source editing).
            if (Array.from(this._editableElementsMap.values()).includes(focusedElement) && !Array.from(editingView.domRoots.values()).includes(focusedElement)) {
                lastFocusedForeignElement = focusedElement;
            }
            const currentFocusedToolbarDefinition = this._getCurrentFocusedToolbarDefinition();
            // * When focusing a toolbar for the first time, set the array of definitions for successive presses of Alt+F10.
            // This ensures, the navigation works always the same and no pair of toolbars takes over
            // (e.g. image and table toolbars when a selected image is inside a cell).
            // * It could be that the focus went to the toolbar by clicking a toolbar item (e.g. a dropdown). In this case,
            // there were no candidates so they must be obtained (#12339).
            if (!currentFocusedToolbarDefinition || !candidateDefinitions) {
                candidateDefinitions = this._getFocusableCandidateToolbarDefinitions();
            }
            // In a single Alt+F10 press, check all candidates but if none were focused, don't go any further.
            // This prevents an infinite loop.
            for(let i = 0; i < candidateDefinitions.length; i++){
                const candidateDefinition = candidateDefinitions.shift();
                // Put the first definition to the back of the array. This allows circular navigation over all toolbars
                // on successive presses of Alt+F10.
                candidateDefinitions.push(candidateDefinition);
                // Don't focus the same toolbar again. If you did, this would move focus from the nth focused toolbar item back to the
                // first item as per ToolbarView#focus() if the user navigated inside the toolbar.
                if (candidateDefinition !== currentFocusedToolbarDefinition && this._focusFocusableCandidateToolbar(candidateDefinition)) {
                    // Clean up after a current visible toolbar when switching to the next one.
                    if (currentFocusedToolbarDefinition && currentFocusedToolbarDefinition.options.afterBlur) {
                        currentFocusedToolbarDefinition.options.afterBlur();
                    }
                    break;
                }
            }
            cancel();
        });
        // Blur the focused toolbar on <kbd>Esc</kbd> and bring the focus back to its origin.
        editor.keystrokes.set('Esc', (data, cancel)=>{
            const focusedToolbarDef = this._getCurrentFocusedToolbarDefinition();
            if (!focusedToolbarDef) {
                return;
            }
            // Bring focus back to where it came from before focusing the toolbar:
            // 1. If it came from outside the engine view (e.g. source editing), move it there.
            if (lastFocusedForeignElement) {
                lastFocusedForeignElement.focus();
                lastFocusedForeignElement = null;
            } else {
                editor.editing.view.focus();
            }
            // Clean up after the toolbar if there is anything to do there.
            if (focusedToolbarDef.options.afterBlur) {
                focusedToolbarDef.options.afterBlur();
            }
            cancel();
        });
    }
    /**
	 * Returns definitions of toolbars that could potentially be focused, sorted by their importance for the user.
	 *
	 * Focusable toolbars candidates are either:
	 * * already visible,
	 * * have `beforeFocus()` set in their {@link module:ui/editorui/editorui~FocusableToolbarDefinition definition} that suggests that
	 * they might show up when called. Keep in mind that determining whether a toolbar will show up (and become focusable) is impossible
	 * at this stage because it depends on its implementation, that in turn depends on the editing context (selection).
	 *
	 * **Note**: Contextual toolbars take precedence over regular toolbars.
	 */ _getFocusableCandidateToolbarDefinitions() {
        const definitions = [];
        for (const toolbarDef of this._focusableToolbarDefinitions){
            const { toolbarView, options } = toolbarDef;
            if (isVisible(toolbarView.element) || options.beforeFocus) {
                definitions.push(toolbarDef);
            }
        }
        // Contextual and already visible toolbars have higher priority. If both are true, the toolbar will always focus first.
        // For instance, a selected widget toolbar vs inline editor toolbar: both are visible but the widget toolbar is contextual.
        definitions.sort((defA, defB)=>getToolbarDefinitionWeight(defA) - getToolbarDefinitionWeight(defB));
        return definitions;
    }
    /**
	 * Returns a definition of the toolbar that is currently visible and focused (one of its children has focus).
	 *
	 * `null` is returned when no toolbar is currently focused.
	 */ _getCurrentFocusedToolbarDefinition() {
        for (const definition of this._focusableToolbarDefinitions){
            if (definition.toolbarView.element && definition.toolbarView.element.contains(this.focusTracker.focusedElement)) {
                return definition;
            }
        }
        return null;
    }
    /**
	 * Focuses a focusable toolbar candidate using its definition.
	 *
	 * @param candidateToolbarDefinition A definition of the toolbar to focus.
	 * @returns `true` when the toolbar candidate was focused. `false` otherwise.
	 */ _focusFocusableCandidateToolbar(candidateToolbarDefinition) {
        const { toolbarView, options: { beforeFocus } } = candidateToolbarDefinition;
        if (beforeFocus) {
            beforeFocus();
        }
        // If it didn't show up after beforeFocus(), it's not focusable at all.
        if (!isVisible(toolbarView.element)) {
            return false;
        }
        toolbarView.focus();
        return true;
    }
    /**
	 * Provides an integration between {@link #viewportOffset} and {@link module:utils/dom/scroll~scrollViewportToShowTarget}.
	 * It allows the UI-agnostic engine method to consider user-configured viewport offsets specific for the integration.
	 *
	 * @param evt The `scrollToTheSelection` event info.
	 * @param data The payload carried by the `scrollToTheSelection` event.
	 */ _handleScrollToTheSelection(evt, data) {
        const configuredViewportOffset = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            ...this.viewportOffset
        };
        data.viewportOffset.top += configuredViewportOffset.top;
        data.viewportOffset.bottom += configuredViewportOffset.bottom;
        data.viewportOffset.left += configuredViewportOffset.left;
        data.viewportOffset.right += configuredViewportOffset.right;
    }
}
/**
 * Returns a number (weight) for a toolbar definition. Visible toolbars have a higher priority and so do
 * contextual toolbars (displayed in the context of a content, for instance, an image toolbar).
 *
 * A standard invisible toolbar is the heaviest. A visible contextual toolbar is the lightest.
 *
 * @param toolbarDef A toolbar definition to be weighted.
 */ function getToolbarDefinitionWeight(toolbarDef) {
    const { toolbarView, options } = toolbarDef;
    let weight = 10;
    // Prioritize already visible toolbars. They should get focused first.
    if (isVisible(toolbarView.element)) {
        weight--;
    }
    // Prioritize contextual toolbars. They are displayed at the selection.
    if (options.isContextual) {
        weight--;
    }
    return weight;
}

/**
 * The editor UI view class. Base class for the editor main views.
 */ class EditorUIView extends View {
    /**
	 * Collection of the child views, detached from the DOM
	 * structure of the editor, like panels, icons etc.
	 */ body;
    /**
	 * Creates an instance of the editor UI view class.
	 *
	 * @param locale The locale instance.
	 */ constructor(locale){
        super(locale);
        this.body = new BodyCollection(locale);
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.body.attachToDom();
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        this.body.detachFromDom();
        return super.destroy();
    }
}

/**
 * The boxed editor UI view class. This class represents an editor interface
 * consisting of a toolbar and an editable area, enclosed within a box.
 */ class BoxedEditorUIView extends EditorUIView {
    /**
	 * Collection of the child views located in the top (`.ck-editor__top`)
	 * area of the UI.
	 */ top;
    /**
	 * Collection of the child views located in the main (`.ck-editor__main`)
	 * area of the UI.
	 */ main;
    /**
	 * Voice label of the UI.
	 */ _voiceLabelView;
    /**
	 * Creates an instance of the boxed editor UI view class.
	 *
	 * @param locale The locale instance..
	 */ constructor(locale){
        super(locale);
        this.top = this.createCollection();
        this.main = this.createCollection();
        this._voiceLabelView = this._createVoiceLabel();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-reset',
                    'ck-editor',
                    'ck-rounded-corners'
                ],
                role: 'application',
                dir: locale.uiLanguageDirection,
                lang: locale.uiLanguage,
                'aria-labelledby': this._voiceLabelView.id
            },
            children: [
                this._voiceLabelView,
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-editor__top',
                            'ck-reset_all'
                        ],
                        role: 'presentation'
                    },
                    children: this.top
                },
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-editor__main'
                        ],
                        role: 'presentation'
                    },
                    children: this.main
                }
            ]
        });
    }
    /**
	 * Creates a voice label view instance.
	 */ _createVoiceLabel() {
        const t = this.t;
        const voiceLabel = new LabelView();
        voiceLabel.text = t('Rich Text Editor');
        voiceLabel.extendTemplate({
            attributes: {
                class: 'ck-voice-label'
            }
        });
        return voiceLabel;
    }
}

/**
 * The editable UI view class.
 */ class EditableUIView extends View {
    /**
	 * The name of the editable UI view.
	 */ name = null;
    /**
	 * The editing view instance the editable is related to. Editable uses the editing
	 * view to dynamically modify its certain DOM attributes after {@link #render rendering}.
	 *
	 * **Note**: The DOM attributes are performed by the editing view and not UI
	 * {@link module:ui/view~View#bindTemplate template bindings} because once rendered,
	 * the editable DOM element must remain under the full control of the engine to work properly.
	 */ _editingView;
    /**
	 * The element which is the main editable element (usually the one with `contentEditable="true"`).
	 */ _editableElement;
    /**
	 * Whether an external {@link #_editableElement} was passed into the constructor, which also means
	 * the view will not render its {@link #template}.
	 */ _hasExternalElement;
    /**
	 * Creates an instance of EditableUIView class.
	 *
	 * @param locale The locale instance.
	 * @param editingView The editing view instance the editable is related to.
	 * @param editableElement The editable element. If not specified, this view
	 * should create it. Otherwise, the existing element should be used.
	 */ constructor(locale, editingView, editableElement){
        super(locale);
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-content',
                    'ck-editor__editable',
                    'ck-rounded-corners'
                ],
                lang: locale.contentLanguage,
                dir: locale.contentLanguageDirection
            }
        });
        this.set('isFocused', false);
        this._editableElement = editableElement;
        this._hasExternalElement = !!this._editableElement;
        this._editingView = editingView;
    }
    /**
	 * Renders the view by either applying the {@link #template} to the existing
	 * {@link module:ui/editableui/editableuiview~EditableUIView#_editableElement} or assigning {@link #element}
	 * as {@link module:ui/editableui/editableuiview~EditableUIView#_editableElement}.
	 */ render() {
        super.render();
        if (this._hasExternalElement) {
            this.template.apply(this.element = this._editableElement);
        } else {
            this._editableElement = this.element;
        }
        this.on('change:isFocused', ()=>this._updateIsFocusedClasses());
        this._updateIsFocusedClasses();
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        if (this._hasExternalElement) {
            this.template.revert(this._editableElement);
        }
        super.destroy();
    }
    /**
	 * Whether an external {@link #_editableElement} was passed into the constructor, which also means
	 * the view will not render its {@link #template}.
	 */ get hasExternalElement() {
        return this._hasExternalElement;
    }
    /**
	 * Updates the `ck-focused` and `ck-blurred` CSS classes on the {@link #element} according to
	 * the {@link #isFocused} property value using the {@link #_editingView editing view} API.
	 */ _updateIsFocusedClasses() {
        const editingView = this._editingView;
        if (editingView.isRenderingInProgress) {
            updateAfterRender(this);
        } else {
            update(this);
        }
        function update(view) {
            editingView.change((writer)=>{
                const viewRoot = editingView.document.getRoot(view.name);
                writer.addClass(view.isFocused ? 'ck-focused' : 'ck-blurred', viewRoot);
                writer.removeClass(view.isFocused ? 'ck-blurred' : 'ck-focused', viewRoot);
            });
        }
        // In a case of a multi-root editor, a callback will be attached more than once (one callback for each root).
        // While executing one callback the `isRenderingInProgress` observable is changing what causes executing another
        // callback and render is called inside the already pending render.
        // We need to be sure that callback is executed only when the value has changed from `true` to `false`.
        // See https://github.com/ckeditor/ckeditor5/issues/1676.
        function updateAfterRender(view) {
            editingView.once('change:isRenderingInProgress', (evt, name, value)=>{
                if (!value) {
                    update(view);
                } else {
                    updateAfterRender(view);
                }
            });
        }
    }
}

/**
 * The inline editable UI class implementing an inline {@link module:ui/editableui/editableuiview~EditableUIView}.
 */ class InlineEditableUIView extends EditableUIView {
    /**
	 * A function that gets called with the instance of this view as an argument and should return a string that
	 * represents the label of the editable for assistive technologies.
	 */ _generateLabel;
    /**
	 * Creates an instance of the InlineEditableUIView class.
	 *
	 * @param locale The locale instance.
	 * @param editingView The editing view instance the editable is related to.
	 * @param editableElement The editable element. If not specified, the
	 * {@link module:ui/editableui/editableuiview~EditableUIView}
	 * will create it. Otherwise, the existing element will be used.
	 * @param options Additional configuration of the view.
	 * @param options.label A function that gets called with the instance of this view as an argument
	 * and should return a string that represents the label of the editable for assistive technologies. If not provided,
	 * a default label generator is used.
	 */ constructor(locale, editingView, editableElement, options = {}){
        super(locale, editingView, editableElement);
        const t = locale.t;
        this.extendTemplate({
            attributes: {
                role: 'textbox',
                class: 'ck-editor__editable_inline'
            }
        });
        this._generateLabel = options.label || (()=>t('Editor editing area: %0', this.name));
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        const editingView = this._editingView;
        editingView.change((writer)=>{
            const viewRoot = editingView.document.getRoot(this.name);
            writer.setAttribute('aria-label', this._generateLabel(this), viewRoot);
        });
    }
}

/**
 * The iframe view class.
 *
 * ```ts
 * const iframe = new IframeView();
 *
 * iframe.render();
 * document.body.appendChild( iframe.element );
 *
 * iframe.on( 'loaded', () => {
 * 	console.log( 'The iframe has loaded', iframe.element.contentWindow );
 * } );
 *
 * iframe.element.src = 'https://ckeditor.com';
 * ```
 */ class IframeView extends View {
    /**
	 * Creates a new instance of the iframe view.
	 *
	 * @param locale The locale instance.
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'iframe',
            attributes: {
                class: [
                    'ck',
                    'ck-reset_all'
                ],
                // It seems that we need to allow scripts in order to be able to listen to events.
                // TODO: Research that. Perhaps the src must be set?
                sandbox: 'allow-same-origin allow-scripts'
            },
            on: {
                load: bind.to('loaded')
            }
        });
    }
    /**
	 * Renders the iframe's {@link #element} and returns a `Promise` for asynchronous
	 * child `contentDocument` loading process.
	 *
	 * @returns A promise which resolves once the iframe `contentDocument` has
	 * been {@link #event:loaded}.
	 */ render() {
        return new Promise((resolve)=>{
            this.on('loaded', resolve);
            return super.render();
        });
    }
}

/**
 * The Notification plugin.
 *
 * This plugin sends a few types of notifications: `success`, `info` and `warning`. The notifications need to be
 * handled and displayed by a plugin responsible for showing the UI of the notifications. Using this plugin for dispatching
 * notifications makes it possible to switch the notifications UI.
 *
 * Note that every unhandled and not stopped `warning` notification will be displayed as a system alert.
 * See {@link module:ui/notification/notification~Notification#showWarning}.
 */ class Notification extends ContextPlugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Notification';
    }
    /**
	 * @inheritDoc
	 */ init() {
        // Each unhandled and not stopped `show:warning` event is displayed as a system alert.
        this.on('show:warning', (evt, data)=>{
            window.alert(data.message); // eslint-disable-line no-alert
        }, {
            priority: 'lowest'
        });
    }
    /**
	 * Shows a success notification.
	 *
	 * By default, it fires the {@link #event:show:success `show:success` event} with the given `data`. The event namespace can be extended
	 * using the `data.namespace` option. For example:
	 *
	 * ```ts
	 * showSuccess( 'Image is uploaded.', {
	 * 	namespace: 'upload:image'
	 * } );
	 * ```
	 *
	 * will fire the `show:success:upload:image` event.
	 *
	 * You can provide the title of the notification:
	 *
	 * ```ts
	 * showSuccess( 'Image is uploaded.', {
	 * 	title: 'Image upload success'
	 * } );
	 * ```
	 *
	 * @param message The content of the notification.
	 * @param data Additional data.
	 * @param data.namespace Additional event namespace.
	 * @param data.title The title of the notification.
	 */ showSuccess(message, data = {}) {
        this._showNotification({
            message,
            type: 'success',
            namespace: data.namespace,
            title: data.title
        });
    }
    /**
	 * Shows an information notification.
	 *
	 * By default, it fires the {@link #event:show:info `show:info` event} with the given `data`. The event namespace can be extended
	 * using the `data.namespace` option. For example:
	 *
	 * ```ts
	 * showInfo( 'Editor is offline.', {
	 * 	namespace: 'editor:status'
	 * } );
	 * ```
	 *
	 * will fire the `show:info:editor:status` event.
	 *
	 * You can provide the title of the notification:
	 *
	 * ```ts
	 * showInfo( 'Editor is offline.', {
	 * 	title: 'Network information'
	 * } );
	 * ```
	 *
	 * @param message The content of the notification.
	 * @param data Additional data.
	 * @param data.namespace Additional event namespace.
	 * @param data.title The title of the notification.
	 */ showInfo(message, data = {}) {
        this._showNotification({
            message,
            type: 'info',
            namespace: data.namespace,
            title: data.title
        });
    }
    /**
	 * Shows a warning notification.
	 *
	 * By default, it fires the {@link #event:show:warning `show:warning` event}
	 * with the given `data`. The event namespace can be extended using the `data.namespace` option. For example:
	 *
	 * ```ts
	 * showWarning( 'Image upload error.', {
	 * 	namespace: 'upload:image'
	 * } );
	 * ```
	 *
	 * will fire the `show:warning:upload:image` event.
	 *
	 * You can provide the title of the notification:
	 *
	 * ```ts
	 * showWarning( 'Image upload error.', {
	 * 	title: 'Upload failed'
	 * } );
	 * ```
	 *
	 * Note that each unhandled and not stopped `warning` notification will be displayed as a system alert.
	 * The plugin responsible for displaying warnings should `stop()` the event to prevent displaying it as an alert:
	 *
	 * ```ts
	 * notifications.on( 'show:warning', ( evt, data ) => {
	 * 	// Do something with the data.
	 *
	 * 	// Stop this event to prevent displaying it as an alert.
	 * 	evt.stop();
	 * } );
	 * ```
	 *
	 * You can attach many listeners to the same event and `stop()` this event in a listener with a low priority:
	 *
	 * ```ts
	 * notifications.on( 'show:warning', ( evt, data ) => {
	 * 	// Show the warning in the UI, but do not stop it.
	 * } );
	 *
	 * notifications.on( 'show:warning', ( evt, data ) => {
	 * 	// Log the warning to some error tracker.
	 *
	 * 	// Stop this event to prevent displaying it as an alert.
	 * 	evt.stop();
	 * }, { priority: 'low' } );
	 * ```
	 *
	 * @param message The content of the notification.
	 * @param data Additional data.
	 * @param data.namespace Additional event namespace.
	 * @param data.title The title of the notification.
	 */ showWarning(message, data = {}) {
        this._showNotification({
            message,
            type: 'warning',
            namespace: data.namespace,
            title: data.title
        });
    }
    /**
	 * Fires the `show` event with the specified type, namespace and message.
	 *
	 * @param data The message data.
	 * @param data.message The content of the notification.
	 * @param data.type The type of the message.
	 * @param data.namespace Additional event namespace.
	 * @param data.title The title of the notification.
	 */ _showNotification(data) {
        const event = data.namespace ? `show:${data.type}:${data.namespace}` : `show:${data.type}`;
        this.fire(event, {
            message: data.message,
            type: data.type,
            title: data.title || ''
        });
    }
}

/**
 * The base MVC model class.
 */ class Model extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * Creates a new Model instance.
	 *
	 * @param attributes The model state attributes to be defined during the instance creation.
	 * @param properties The (out of state) properties to be appended to the instance during creation.
	 */ constructor(attributes, properties){
        super();
        // Extend this instance with the additional (out of state) properties.
        if (properties) {
            extend(this, properties);
        }
        // Initialize the attributes.
        if (attributes) {
            this.set(attributes);
        }
    }
}

const toPx$4 = /* #__PURE__ */ toUnit('px');
/**
 * Provides the common contextual balloon for the editor.
 *
 * The role of this plugin is to unify the contextual balloons logic, simplify views management and help
 * avoid the unnecessary complexity of handling multiple {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView}
 * instances in the editor.
 *
 * This plugin allows for creating single or multiple panel stacks.
 *
 * Each stack may have multiple views, with the one on the top being visible. When the visible view is removed from the stack,
 * the previous view becomes visible.
 *
 * It might be useful to implement nested navigation in a balloon. For instance, a toolbar view may contain a link button.
 * When you click it, a link view (which lets you set the URL) is created and put on top of the toolbar view, so the link panel
 * is displayed. When you finish editing the link and close (remove) the link view, the toolbar view is visible again.
 *
 * However, there are cases when there are multiple independent balloons to be displayed, for instance, if the selection
 * is inside two inline comments at the same time. For such cases, you can create two independent panel stacks.
 * The contextual balloon plugin will create a navigation bar to let the users switch between these panel stacks using the "Next"
 * and "Previous" buttons.
 *
 * If there are no views in the current stack, the balloon panel will try to switch to the next stack. If there are no
 * panels in any stack, the balloon panel will be hidden.
 *
 * **Note**: To force the balloon panel to show only one view, even if there are other stacks, use the `singleViewMode=true` option
 * when {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon#add adding} a view to a panel.
 *
 * From the implementation point of view, the contextual ballon plugin is reusing a single
 * {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView} instance to display multiple contextual balloon
 * panels in the editor. It also creates a special {@link module:ui/panel/balloon/contextualballoon~RotatorView rotator view},
 * used to manage multiple panel stacks. Rotator view is a child of the balloon panel view and the parent of the specific
 * view you want to display. If there is more than one panel stack to be displayed, the rotator view will add a
 * navigation bar. If there is only one stack, the rotator view is transparent (it does not add any UI elements).
 */ class ContextualBalloon extends Plugin {
    /**
	 * The {@link module:utils/dom/position~Options#limiter position limiter}
	 * for the {@link #view balloon}, used when no `limiter` has been passed into {@link #add}
	 * or {@link #updatePosition}.
	 *
	 * By default, a function that obtains the farthest DOM
	 * {@link module:engine/view/rooteditableelement~RootEditableElement}
	 * of the {@link module:engine/view/document~Document#selection}.
	 */ positionLimiter;
    visibleStack;
    /**
	 * The map of views and their stacks.
	 */ _viewToStack = new Map();
    /**
	 * The map of IDs and stacks.
	 */ _idToStack = new Map();
    /**
	 * The common balloon panel view.
	 */ _view = null;
    /**
	 * Rotator view embedded in the contextual balloon.
	 * Displays the currently visible view in the balloon and provides navigation for switching stacks.
	 */ _rotatorView = null;
    /**
	 * Displays fake panels under the balloon panel view when multiple stacks are added to the balloon.
	 */ _fakePanelsView = null;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'ContextualBalloon';
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        this.positionLimiter = ()=>{
            const view = this.editor.editing.view;
            const viewDocument = view.document;
            const editableElement = viewDocument.selection.editableElement;
            if (editableElement) {
                return view.domConverter.mapViewToDom(editableElement.root);
            }
            return null;
        };
        this.set('visibleView', null);
        this.set('_numberOfStacks', 0);
        this.set('_singleViewMode', false);
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        if (this._view) {
            this._view.destroy();
        }
        if (this._rotatorView) {
            this._rotatorView.destroy();
        }
        if (this._fakePanelsView) {
            this._fakePanelsView.destroy();
        }
    }
    /**
	 * The common balloon panel view.
	 */ get view() {
        if (!this._view) {
            this._createPanelView();
        }
        return this._view;
    }
    /**
	 * Returns `true` when the given view is in one of the stacks. Otherwise returns `false`.
	 */ hasView(view) {
        return Array.from(this._viewToStack.keys()).includes(view);
    }
    /**
	 * Adds a new view to the stack and makes it visible if the current stack is visible
	 * or it is the first view in the balloon.
	 *
	 * @param data The configuration of the view.
	 * @param data.stackId The ID of the stack that the view is added to. Defaults to `'main'`.
	 * @param data.view The content of the balloon.
	 * @param data.position Positioning options.
	 * @param data.balloonClassName An additional CSS class added to the {@link #view balloon} when visible.
	 * @param data.withArrow Whether the {@link #view balloon} should be rendered with an arrow. Defaults to `true`.
	 * @param data.singleViewMode Whether the view should be the only visible view even if other stacks were added. Defaults to `false`.
	 */ add(data) {
        if (!this._view) {
            this._createPanelView();
        }
        if (this.hasView(data.view)) {
            /**
			 * Trying to add configuration of the same view more than once.
			 *
			 * @error contextualballoon-add-view-exist
			 */ throw new CKEditorError('contextualballoon-add-view-exist', [
                this,
                data
            ]);
        }
        const stackId = data.stackId || 'main';
        // If new stack is added, creates it and show view from this stack.
        if (!this._idToStack.has(stackId)) {
            this._idToStack.set(stackId, new Map([
                [
                    data.view,
                    data
                ]
            ]));
            this._viewToStack.set(data.view, this._idToStack.get(stackId));
            this._numberOfStacks = this._idToStack.size;
            if (!this._visibleStack || data.singleViewMode) {
                this.showStack(stackId);
            }
            return;
        }
        const stack = this._idToStack.get(stackId);
        if (data.singleViewMode) {
            this.showStack(stackId);
        }
        // Add new view to the stack.
        stack.set(data.view, data);
        this._viewToStack.set(data.view, stack);
        // And display it if is added to the currently visible stack.
        if (stack === this._visibleStack) {
            this._showView(data);
        }
    }
    /**
	 * Removes the given view from the stack. If the removed view was visible,
	 * the view preceding it in the stack will become visible instead.
	 * When there is no view in the stack, the next stack will be displayed.
	 * When there are no more stacks, the balloon will hide.
	 *
	 * @param view A view to be removed from the balloon.
	 */ remove(view) {
        if (!this.hasView(view)) {
            /**
			 * Trying to remove the configuration of the view not defined in the stack.
			 *
			 * @error contextualballoon-remove-view-not-exist
			 */ throw new CKEditorError('contextualballoon-remove-view-not-exist', [
                this,
                view
            ]);
        }
        const stack = this._viewToStack.get(view);
        if (this._singleViewMode && this.visibleView === view) {
            this._singleViewMode = false;
        }
        // When visible view will be removed we need to show a preceding view or next stack
        // if a view is the only view in the stack.
        if (this.visibleView === view) {
            if (stack.size === 1) {
                if (this._idToStack.size > 1) {
                    this._showNextStack();
                } else {
                    this.view.hide();
                    this.visibleView = null;
                    this._rotatorView.hideView();
                }
            } else {
                this._showView(Array.from(stack.values())[stack.size - 2]);
            }
        }
        if (stack.size === 1) {
            this._idToStack.delete(this._getStackId(stack));
            this._numberOfStacks = this._idToStack.size;
        } else {
            stack.delete(view);
        }
        this._viewToStack.delete(view);
    }
    /**
	 * Updates the position of the balloon using the position data of the first visible view in the stack.
	 * When new position data is given, the position data of the currently visible view will be updated.
	 *
	 * @param position Position options.
	 */ updatePosition(position) {
        if (position) {
            this._visibleStack.get(this.visibleView).position = position;
        }
        this.view.pin(this._getBalloonPosition());
        this._fakePanelsView.updatePosition();
    }
    /**
	 * Shows the last view from the stack of a given ID.
	 */ showStack(id) {
        this.visibleStack = id;
        const stack = this._idToStack.get(id);
        if (!stack) {
            /**
			 * Trying to show a stack that does not exist.
			 *
			 * @error contextualballoon-showstack-stack-not-exist
			 */ throw new CKEditorError('contextualballoon-showstack-stack-not-exist', this);
        }
        if (this._visibleStack === stack) {
            return;
        }
        this._showView(Array.from(stack.values()).pop());
    }
    /**
	 * Initializes view instances.
	 */ _createPanelView() {
        this._view = new BalloonPanelView(this.editor.locale);
        this.editor.ui.view.body.add(this._view);
        this.editor.ui.focusTracker.add(this._view.element);
        this._rotatorView = this._createRotatorView();
        this._fakePanelsView = this._createFakePanelsView();
    }
    /**
	 * Returns the stack of the currently visible view.
	 */ get _visibleStack() {
        return this._viewToStack.get(this.visibleView);
    }
    /**
	 * Returns the ID of the given stack.
	 */ _getStackId(stack) {
        const entry = Array.from(this._idToStack.entries()).find((entry)=>entry[1] === stack);
        return entry[0];
    }
    /**
	 * Shows the last view from the next stack.
	 */ _showNextStack() {
        const stacks = Array.from(this._idToStack.values());
        let nextIndex = stacks.indexOf(this._visibleStack) + 1;
        if (!stacks[nextIndex]) {
            nextIndex = 0;
        }
        this.showStack(this._getStackId(stacks[nextIndex]));
    }
    /**
	 * Shows the last view from the previous stack.
	 */ _showPrevStack() {
        const stacks = Array.from(this._idToStack.values());
        let nextIndex = stacks.indexOf(this._visibleStack) - 1;
        if (!stacks[nextIndex]) {
            nextIndex = stacks.length - 1;
        }
        this.showStack(this._getStackId(stacks[nextIndex]));
    }
    /**
	 * Creates a rotator view.
	 */ _createRotatorView() {
        const view = new RotatorView(this.editor.locale);
        const t = this.editor.locale.t;
        this.view.content.add(view);
        // Hide navigation when there is only a one stack & not in single view mode.
        view.bind('isNavigationVisible').to(this, '_numberOfStacks', this, '_singleViewMode', (value, isSingleViewMode)=>{
            return !isSingleViewMode && value > 1;
        });
        // Update balloon position after toggling navigation.
        view.on('change:isNavigationVisible', ()=>this.updatePosition(), {
            priority: 'low'
        });
        // Update stacks counter value.
        view.bind('counter').to(this, 'visibleView', this, '_numberOfStacks', (visibleView, numberOfStacks)=>{
            if (numberOfStacks < 2) {
                return '';
            }
            const current = Array.from(this._idToStack.values()).indexOf(this._visibleStack) + 1;
            return t('%0 of %1', [
                current,
                numberOfStacks
            ]);
        });
        view.buttonNextView.on('execute', ()=>{
            // When current view has a focus then move focus to the editable before removing it,
            // otherwise editor will lost focus.
            if (view.focusTracker.isFocused) {
                this.editor.editing.view.focus();
            }
            this._showNextStack();
        });
        view.buttonPrevView.on('execute', ()=>{
            // When current view has a focus then move focus to the editable before removing it,
            // otherwise editor will lost focus.
            if (view.focusTracker.isFocused) {
                this.editor.editing.view.focus();
            }
            this._showPrevStack();
        });
        return view;
    }
    /**
	 * Creates a fake panels view.
	 */ _createFakePanelsView() {
        const view = new FakePanelsView(this.editor.locale, this.view);
        view.bind('numberOfPanels').to(this, '_numberOfStacks', this, '_singleViewMode', (number, isSingleViewMode)=>{
            const showPanels = !isSingleViewMode && number >= 2;
            return showPanels ? Math.min(number - 1, 2) : 0;
        });
        view.listenTo(this.view, 'change:top', ()=>view.updatePosition());
        view.listenTo(this.view, 'change:left', ()=>view.updatePosition());
        this.editor.ui.view.body.add(view);
        return view;
    }
    /**
	 * Sets the view as the content of the balloon and attaches the balloon using position
	 * options of the first view.
	 *
	 * @param data Configuration.
	 * @param data.view The view to show in the balloon.
	 * @param data.balloonClassName Additional class name which will be added to the {@link #view balloon}.
	 * @param data.withArrow Whether the {@link #view balloon} should be rendered with an arrow.
	 */ _showView({ view, balloonClassName = '', withArrow = true, singleViewMode = false }) {
        this.view.class = balloonClassName;
        this.view.withArrow = withArrow;
        this._rotatorView.showView(view);
        this.visibleView = view;
        this.view.pin(this._getBalloonPosition());
        this._fakePanelsView.updatePosition();
        if (singleViewMode) {
            this._singleViewMode = true;
        }
    }
    /**
	 * Returns position options of the last view in the stack.
	 * This keeps the balloon in the same position when the view is changed.
	 */ _getBalloonPosition() {
        let position = Array.from(this._visibleStack.values()).pop().position;
        if (position) {
            // Use the default limiter if none has been specified.
            if (!position.limiter) {
                // Don't modify the original options object.
                position = Object.assign({}, position, {
                    limiter: this.positionLimiter
                });
            }
            // Don't modify the original options object.
            position = Object.assign({}, position, {
                viewportOffsetConfig: this.editor.ui.viewportOffset
            });
        }
        return position;
    }
}
/**
 * Rotator view is a helper class for the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon ContextualBalloon}.
 * It is used for displaying the last view from the current stack and providing navigation buttons for switching stacks.
 * See the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon ContextualBalloon} documentation to learn more.
 */ class RotatorView extends View {
    /**
	 * Used for checking if a view is focused or not.
	 */ focusTracker;
    /**
	 * Navigation button for switching the stack to the previous one.
	 */ buttonPrevView;
    /**
	 * Navigation button for switching the stack to the next one.
	 */ buttonNextView;
    /**
	 * A collection of the child views that creates the rotator content.
	 */ content;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const t = locale.t;
        const bind = this.bindTemplate;
        this.set('isNavigationVisible', true);
        this.focusTracker = new FocusTracker();
        this.buttonPrevView = this._createButtonView(t('Previous'), icons.previousArrow);
        this.buttonNextView = this._createButtonView(t('Next'), icons.nextArrow);
        this.content = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-balloon-rotator'
                ],
                'z-index': '-1'
            },
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck-balloon-rotator__navigation',
                            bind.to('isNavigationVisible', (value)=>value ? '' : 'ck-hidden')
                        ]
                    },
                    children: [
                        this.buttonPrevView,
                        {
                            tag: 'span',
                            attributes: {
                                class: [
                                    'ck-balloon-rotator__counter'
                                ]
                            },
                            children: [
                                {
                                    text: bind.to('counter')
                                }
                            ]
                        },
                        this.buttonNextView
                    ]
                },
                {
                    tag: 'div',
                    attributes: {
                        class: 'ck-balloon-rotator__content'
                    },
                    children: this.content
                }
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.focusTracker.add(this.element);
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.focusTracker.destroy();
    }
    /**
	 * Shows a given view.
	 *
	 * @param view The view to show.
	 */ showView(view) {
        this.hideView();
        this.content.add(view);
    }
    /**
	 * Hides the currently displayed view.
	 */ hideView() {
        this.content.clear();
    }
    /**
	 * Creates a navigation button view.
	 *
	 * @param label The button label.
	 * @param icon The button icon.
	 */ _createButtonView(label, icon) {
        const view = new ButtonView(this.locale);
        view.set({
            label,
            icon,
            tooltip: true
        });
        return view;
    }
}
/**
 * Displays additional layers under the balloon when multiple stacks are added to the balloon.
 */ class FakePanelsView extends View {
    /**
	 * Collection of the child views which creates fake panel content.
	 */ content;
    /**
	 * Context.
	 */ _balloonPanelView;
    /**
	 * @inheritDoc
	 */ constructor(locale, balloonPanelView){
        super(locale);
        const bind = this.bindTemplate;
        this.set('top', 0);
        this.set('left', 0);
        this.set('height', 0);
        this.set('width', 0);
        this.set('numberOfPanels', 0);
        this.content = this.createCollection();
        this._balloonPanelView = balloonPanelView;
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck-fake-panel',
                    bind.to('numberOfPanels', (number)=>number ? '' : 'ck-hidden')
                ],
                style: {
                    top: bind.to('top', toPx$4),
                    left: bind.to('left', toPx$4),
                    width: bind.to('width', toPx$4),
                    height: bind.to('height', toPx$4)
                }
            },
            children: this.content
        });
        this.on('change:numberOfPanels', (evt, name, next, prev)=>{
            if (next > prev) {
                this._addPanels(next - prev);
            } else {
                this._removePanels(prev - next);
            }
            this.updatePosition();
        });
    }
    _addPanels(number) {
        while(number--){
            const view = new View();
            view.setTemplate({
                tag: 'div'
            });
            this.content.add(view);
            this.registerChild(view);
        }
    }
    _removePanels(number) {
        while(number--){
            const view = this.content.last;
            this.content.remove(view);
            this.deregisterChild(view);
            view.destroy();
        }
    }
    /**
	 * Updates coordinates of fake panels.
	 */ updatePosition() {
        if (this.numberOfPanels) {
            const { top, left } = this._balloonPanelView;
            const { width, height } = new Rect(this._balloonPanelView.element);
            Object.assign(this, {
                top,
                left,
                width,
                height
            });
        }
    }
}

const toPx$3 = /* #__PURE__ */ toUnit('px');
/**
 * The sticky panel view class.
 */ class StickyPanelView extends View {
    /**
	 * Collection of the child views which creates balloon panel contents.
	 */ content;
    /**
	 * The panel which accepts children into {@link #content} collection.
	 * Also an element which is positioned when {@link #isSticky}.
	 */ contentPanelElement;
    /**
	 * A dummy element which visually fills the space as long as the
	 * actual panel is sticky. It prevents flickering of the UI.
	 */ _contentPanelPlaceholder;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isActive', false);
        this.set('isSticky', false);
        this.set('limiterElement', null);
        this.set('limiterBottomOffset', 50);
        this.set('viewportTopOffset', 0);
        this.set('_marginLeft', null);
        this.set('_isStickyToTheBottomOfLimiter', false);
        this.set('_stickyTopOffset', null);
        this.set('_stickyBottomOffset', null);
        this.content = this.createCollection();
        this._contentPanelPlaceholder = new Template({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel__placeholder'
                ],
                style: {
                    display: bind.to('isSticky', (isSticky)=>isSticky ? 'block' : 'none'),
                    height: bind.to('isSticky', (isSticky)=>{
                        return isSticky ? toPx$3(this._contentPanelRect.height) : null;
                    })
                }
            }
        }).render();
        this.contentPanelElement = new Template({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel__content',
                    // Toggle class of the panel when "sticky" state changes in the view.
                    bind.if('isSticky', 'ck-sticky-panel__content_sticky'),
                    bind.if('_isStickyToTheBottomOfLimiter', 'ck-sticky-panel__content_sticky_bottom-limit')
                ],
                style: {
                    width: bind.to('isSticky', (isSticky)=>{
                        return isSticky ? toPx$3(this._contentPanelPlaceholder.getBoundingClientRect().width) : null;
                    }),
                    top: bind.to('_stickyTopOffset', (value)=>value ? toPx$3(value) : value),
                    bottom: bind.to('_stickyBottomOffset', (value)=>value ? toPx$3(value) : value),
                    marginLeft: bind.to('_marginLeft')
                }
            },
            children: this.content
        }).render();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel'
                ]
            },
            children: [
                this._contentPanelPlaceholder,
                this.contentPanelElement
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        // Check if the panel should go into the sticky state immediately.
        this.checkIfShouldBeSticky();
        // Update sticky state of the panel as the window and ancestors are being scrolled.
        this.listenTo(global.document, 'scroll', ()=>{
            this.checkIfShouldBeSticky();
        }, {
            useCapture: true
        });
        // Synchronize with `model.isActive` because sticking an inactive panel is pointless.
        this.listenTo(this, 'change:isActive', ()=>{
            this.checkIfShouldBeSticky();
        });
    }
    /**
	 * Analyzes the environment to decide whether the panel should be sticky or not.
	 * Then handles the positioning of the panel.
	 */ checkIfShouldBeSticky() {
        // @if CK_DEBUG_STICKYPANEL // RectDrawer.clear();
        if (!this.limiterElement || !this.isActive) {
            this._unstick();
            return;
        }
        const limiterRect = new Rect(this.limiterElement);
        let visibleLimiterRect = limiterRect.getVisible();
        if (visibleLimiterRect) {
            const windowRect = new Rect(global.window);
            windowRect.top += this.viewportTopOffset;
            windowRect.height -= this.viewportTopOffset;
            visibleLimiterRect = visibleLimiterRect.getIntersection(windowRect);
        }
        // @if CK_DEBUG_STICKYPANEL // if ( visibleLimiterRect ) {
        // @if CK_DEBUG_STICKYPANEL // 	RectDrawer.draw( visibleLimiterRect,
        // @if CK_DEBUG_STICKYPANEL // 		{ outlineWidth: '3px', opacity: '.8', outlineColor: 'red', outlineOffset: '-3px' },
        // @if CK_DEBUG_STICKYPANEL // 		'Visible anc'
        // @if CK_DEBUG_STICKYPANEL // 	);
        // @if CK_DEBUG_STICKYPANEL // }
        // @if CK_DEBUG_STICKYPANEL //
        // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( limiterRect,
        // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '3px', opacity: '.8', outlineColor: 'green', outlineOffset: '-3px' },
        // @if CK_DEBUG_STICKYPANEL // 	'Limiter'
        // @if CK_DEBUG_STICKYPANEL // );
        // Stick the panel only if
        // * the limiter's ancestors are intersecting with each other so that some of their rects are visible,
        // * and the limiter's top edge is above the visible ancestors' top edge.
        if (visibleLimiterRect && limiterRect.top < visibleLimiterRect.top) {
            // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( visibleLimiterRect,
            // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '3px', opacity: '.8', outlineColor: 'fuchsia', outlineOffset: '-3px',
            // @if CK_DEBUG_STICKYPANEL // 		backgroundColor: 'rgba(255, 0, 255, .3)' },
            // @if CK_DEBUG_STICKYPANEL // 	'Visible limiter'
            // @if CK_DEBUG_STICKYPANEL // );
            const visibleLimiterTop = visibleLimiterRect.top;
            // Check if there's a change the panel can be sticky to the bottom of the limiter.
            if (visibleLimiterTop + this._contentPanelRect.height + this.limiterBottomOffset > visibleLimiterRect.bottom) {
                const stickyBottomOffset = Math.max(limiterRect.bottom - visibleLimiterRect.bottom, 0) + this.limiterBottomOffset;
                // @if CK_DEBUG_STICKYPANEL // const stickyBottomOffsetRect = new Rect( {
                // @if CK_DEBUG_STICKYPANEL // 	top: limiterRect.bottom - stickyBottomOffset, left: 0, right: 2000,
                // @if CK_DEBUG_STICKYPANEL // 	bottom: limiterRect.bottom - stickyBottomOffset, width: 2000, height: 1
                // @if CK_DEBUG_STICKYPANEL // } );
                // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( stickyBottomOffsetRect,
                // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '1px', opacity: '.8', outlineColor: 'black' },
                // @if CK_DEBUG_STICKYPANEL // 	'Sticky bottom offset'
                // @if CK_DEBUG_STICKYPANEL // );
                // Check if sticking the panel to the bottom of the limiter does not cause it to suddenly
                // move upwards if there's not enough space for it.
                if (limiterRect.bottom - stickyBottomOffset > limiterRect.top + this._contentPanelRect.height) {
                    this._stickToBottomOfLimiter(stickyBottomOffset);
                } else {
                    this._unstick();
                }
            } else {
                if (this._contentPanelRect.height + this.limiterBottomOffset < limiterRect.height) {
                    this._stickToTopOfAncestors(visibleLimiterTop);
                } else {
                    this._unstick();
                }
            }
        } else {
            this._unstick();
        }
    // @if CK_DEBUG_STICKYPANEL // console.clear();
    // @if CK_DEBUG_STICKYPANEL // console.log( 'isSticky', this.isSticky );
    // @if CK_DEBUG_STICKYPANEL // console.log( '_isStickyToTheBottomOfLimiter', this._isStickyToTheBottomOfLimiter );
    // @if CK_DEBUG_STICKYPANEL // console.log( '_stickyTopOffset', this._stickyTopOffset );
    // @if CK_DEBUG_STICKYPANEL // console.log( '_stickyBottomOffset', this._stickyBottomOffset );
    // @if CK_DEBUG_STICKYPANEL // if ( visibleLimiterRect ) {
    // @if CK_DEBUG_STICKYPANEL // 	RectDrawer.draw( visibleLimiterRect,
    // @if CK_DEBUG_STICKYPANEL // 		{ ...diagonalStylesBlack,
    // @if CK_DEBUG_STICKYPANEL // 			outlineWidth: '3px', opacity: '.8', outlineColor: 'orange', outlineOffset: '-3px',
    // @if CK_DEBUG_STICKYPANEL // 			backgroundColor: 'rgba(0, 0, 255, .2)' },
    // @if CK_DEBUG_STICKYPANEL // 		'visibleLimiterRect'
    // @if CK_DEBUG_STICKYPANEL // 	);
    // @if CK_DEBUG_STICKYPANEL // }
    }
    /**
	 * Sticks the panel at the given CSS `top` offset.
	 *
	 * @private
	 * @param topOffset
	 */ _stickToTopOfAncestors(topOffset) {
        this.isSticky = true;
        this._isStickyToTheBottomOfLimiter = false;
        this._stickyTopOffset = topOffset;
        this._stickyBottomOffset = null;
        this._marginLeft = toPx$3(-global.window.scrollX);
    }
    /**
	 * Sticks the panel at the bottom of the limiter with a given CSS `bottom` offset.
	 *
	 * @private
	 * @param stickyBottomOffset
	 */ _stickToBottomOfLimiter(stickyBottomOffset) {
        this.isSticky = true;
        this._isStickyToTheBottomOfLimiter = true;
        this._stickyTopOffset = null;
        this._stickyBottomOffset = stickyBottomOffset;
        this._marginLeft = toPx$3(-global.window.scrollX);
    }
    /**
	 * Unsticks the panel putting it back to its original position.
	 *
	 * @private
	 */ _unstick() {
        this.isSticky = false;
        this._isStickyToTheBottomOfLimiter = false;
        this._stickyTopOffset = null;
        this._stickyBottomOffset = null;
        this._marginLeft = null;
    }
    /**
	 * Returns the bounding rect of the {@link #contentPanelElement}.
	 *
	 * @private
	 */ get _contentPanelRect() {
        return new Rect(this.contentPanelElement);
    }
}

/**
 * A search input field for the {@link module:ui/search/text/searchtextview~SearchTextView} component.
 *
 * @internal
 * @extends module:ui/labeledfield/labeledfieldview~LabeledFieldView
 */ class SearchTextQueryView extends LabeledFieldView {
    /**
	 * The loupe icon displayed next to the {@link #fieldView}.
	 */ iconView;
    /**
	 * The button that clears and focuses the {@link #fieldView}.
	 */ resetButtonView;
    /**
	 * A reference to the view configuration.
	 */ _viewConfig;
    /**
	 * @inheritDoc
	 */ constructor(locale, config){
        const t = locale.t;
        const viewConfig = Object.assign({}, {
            showResetButton: true,
            showIcon: true,
            creator: createLabeledInputText
        }, config);
        super(locale, viewConfig.creator);
        this.label = config.label;
        this._viewConfig = viewConfig;
        if (this._viewConfig.showIcon) {
            this.iconView = new IconView();
            this.iconView.content = icons.loupe;
            this.fieldWrapperChildren.add(this.iconView, 0);
            this.extendTemplate({
                attributes: {
                    class: 'ck-search__query_with-icon'
                }
            });
        }
        if (this._viewConfig.showResetButton) {
            this.resetButtonView = new ButtonView(locale);
            this.resetButtonView.set({
                label: t('Clear'),
                icon: icons.cancel,
                class: 'ck-search__reset',
                isVisible: false,
                tooltip: true
            });
            this.resetButtonView.on('execute', ()=>{
                this.reset();
                this.focus();
                this.fire('reset');
            });
            this.resetButtonView.bind('isVisible').to(this.fieldView, 'isEmpty', (isEmpty)=>!isEmpty);
            this.fieldWrapperChildren.add(this.resetButtonView);
            this.extendTemplate({
                attributes: {
                    class: 'ck-search__query_with-reset'
                }
            });
        }
    }
    /**
	 * Resets the search field to its default state.
	 */ reset() {
        this.fieldView.reset();
        if (this._viewConfig.showResetButton) {
            this.resetButtonView.isVisible = false;
        }
    }
}

/**
 * A view displaying an information text related to different states of {@link module:ui/search/text/searchtextview~SearchTextView}.
 *
 * @internal
 */ class SearchInfoView extends View {
    /**
	 * @inheritDoc
	 */ constructor(){
        super();
        const bind = this.bindTemplate;
        this.set({
            isVisible: false,
            primaryText: '',
            secondaryText: ''
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-search__info',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ],
                tabindex: -1
            },
            children: [
                {
                    tag: 'span',
                    children: [
                        {
                            text: [
                                bind.to('primaryText')
                            ]
                        }
                    ]
                },
                {
                    tag: 'span',
                    children: [
                        {
                            text: [
                                bind.to('secondaryText')
                            ]
                        }
                    ]
                }
            ]
        });
    }
    /**
	 * Focuses the view
	 */ focus() {
        this.element.focus();
    }
}

/**
 * A sub-component of {@link module:ui/search/text/searchtextview~SearchTextView}. It hosts the filtered and the information views.
 */ class SearchResultsView extends View {
    /**
	 * Tracks information about the DOM focus in the view.
	 *
	 * @readonly
	 */ focusTracker;
    /**
	 * The collection of the child views inside of the list item {@link #element}.
	 *
	 * @readonly
	 */ children;
    /**
	 * Provides the focus management (keyboard navigation) in the view.
	 *
	 * @readonly
	 */ _focusCycler;
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        this.children = this.createCollection();
        this.focusTracker = new FocusTracker();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-search__results'
                ],
                tabindex: -1
            },
            children: this.children
        });
        this._focusCycler = new FocusCycler({
            focusables: this.children,
            focusTracker: this.focusTracker
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        for (const child of this.children){
            this.focusTracker.add(child.element);
        }
    }
    /**
	 * Focuses the view.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the first child view.
	 */ focusFirst() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Focuses the last child view.
	 */ focusLast() {
        this._focusCycler.focusLast();
    }
}

/**
 * A search component that allows filtering of an arbitrary view based on a search query
 * specified by the user in a text field.
 *
 *```ts
 * // This view must specify the `filter()` and `focus()` methods.
 * const filteredView = ...;
 *
 * const searchView = new SearchTextView( locale, {
 * 	searchFieldLabel: 'Search list items',
 * 	filteredView
 * } );
 *
 * view.render();
 *
 * document.body.append( view.element );
 * ```
 */ class SearchTextView extends View {
    /**
	 * Tracks information about the DOM focus in the view.
	 *
	 * @readonly
	 */ focusTracker;
    /**
	 * An instance of the keystroke handler managing user interaction and accessibility.
	 *
	 * @readonly
	 */ keystrokes;
    /**
	 * A view hosting the {@link #filteredView} passed in the configuration and the {@link #infoView}.
	 */ resultsView;
    /**
	 * The view that is filtered by the search query.
	 */ filteredView;
    /**
	 * The view that displays the information about the search results.
	 */ infoView;
    /**
	 * The view that allows the user to enter the search query.
	 */ queryView;
    /**
	 * Provides the focus management (keyboard navigation) between {@link #queryView} and {@link #filteredView}.
	 *
	 * @readonly
	 */ focusCycler;
    /**
	 * The cached configuration object.
	 *
	 * @internal
	 */ _config;
    /**
	 * Creates an instance of the {@link module:ui/search/text/searchtextview~SearchTextView} class.
	 *
	 * @param locale The localization services instance.
	 * @param config Configuration of the view.
	 */ constructor(locale, config){
        super(locale);
        this._config = config;
        this.filteredView = config.filteredView;
        this.queryView = this._createSearchTextQueryView();
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this.resultsView = new SearchResultsView(locale);
        this.children = this.createCollection();
        this.focusableChildren = this.createCollection([
            this.queryView,
            this.resultsView
        ]);
        this.set('isEnabled', true);
        this.set('resultsCount', 0);
        this.set('totalItemsCount', 0);
        if (config.infoView && config.infoView.instance) {
            this.infoView = config.infoView.instance;
        } else {
            this.infoView = new SearchInfoView();
            this._enableDefaultInfoViewBehavior();
            this.on('render', ()=>{
                // Initial search that determines if there are any searchable items
                // and displays the corresponding info text.
                this.search('');
            });
        }
        this.resultsView.children.addMany([
            this.infoView,
            this.filteredView
        ]);
        this.focusCycler = new FocusCycler({
            focusables: this.focusableChildren,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate form fields backwards using the Shift + Tab keystroke.
                focusPrevious: 'shift + tab',
                // Navigate form fields forwards using the Tab key.
                focusNext: 'tab'
            }
        });
        this.on('search', (evt, { resultsCount, totalItemsCount })=>{
            this.resultsCount = resultsCount;
            this.totalItemsCount = totalItemsCount;
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-search',
                    config.class || null
                ],
                tabindex: '-1'
            },
            children: this.children
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.addMany([
            this.queryView,
            this.resultsView
        ]);
        const stopPropagation = (data)=>data.stopPropagation();
        for (const focusableChild of this.focusableChildren){
            this.focusTracker.add(focusableChild.element);
        }
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
        // Since the form is in the dropdown panel which is a child of the toolbar, the toolbar's
        // keystroke handler would take over the key management in the URL input. We need to prevent
        // this ASAP. Otherwise, the basic caret movement using the arrow keys will be impossible.
        this.keystrokes.set('arrowright', stopPropagation);
        this.keystrokes.set('arrowleft', stopPropagation);
        this.keystrokes.set('arrowup', stopPropagation);
        this.keystrokes.set('arrowdown', stopPropagation);
    }
    /**
	 * Focuses the {@link #queryView}.
	 */ focus() {
        this.queryView.focus();
    }
    /**
	 * Resets the component to its initial state.
	 */ reset() {
        this.queryView.reset();
        this.search('');
    }
    /**
	 * Searches the {@link #filteredView} for the given query.
	 *
	 * @internal
	 * @param query The search query string.
	 */ search(query) {
        const regExp = query ? new RegExp(escapeRegExp(query), 'ig') : null;
        const filteringResults = this.filteredView.filter(regExp);
        this.fire('search', {
            query,
            ...filteringResults
        });
    }
    /**
	 * Creates a search field view based on configured creator..
	 */ _createSearchTextQueryView() {
        const queryView = new SearchTextQueryView(this.locale, this._config.queryView);
        this.listenTo(queryView.fieldView, 'input', ()=>{
            this.search(queryView.fieldView.element.value);
        });
        queryView.on('reset', ()=>this.reset());
        queryView.bind('isEnabled').to(this);
        return queryView;
    }
    /**
	 * Initializes the default {@link #infoView} behavior with default text labels when no custom info view
	 * was specified in the view config.
	 */ _enableDefaultInfoViewBehavior() {
        const t = this.locale.t;
        const infoView = this.infoView;
        this.on('search', (evt, data)=>{
            if (!data.resultsCount) {
                const defaultTextConfig = this._config.infoView && this._config.infoView.text;
                let primaryText, secondaryText;
                if (data.totalItemsCount) {
                    if (defaultTextConfig && defaultTextConfig.notFound) {
                        primaryText = defaultTextConfig.notFound.primary;
                        secondaryText = defaultTextConfig.notFound.secondary;
                    } else {
                        primaryText = t('No results found');
                        secondaryText = '';
                    }
                } else {
                    if (defaultTextConfig && defaultTextConfig.noSearchableItems) {
                        primaryText = defaultTextConfig.noSearchableItems.primary;
                        secondaryText = defaultTextConfig.noSearchableItems.secondary;
                    } else {
                        primaryText = t('No searchable items');
                        secondaryText = '';
                    }
                }
                infoView.set({
                    primaryText: normalizeInfoText(primaryText, data),
                    secondaryText: normalizeInfoText(secondaryText, data),
                    isVisible: true
                });
            } else {
                infoView.set({
                    isVisible: false
                });
            }
        });
        function normalizeInfoText(text, { query, resultsCount, totalItemsCount }) {
            return typeof text === 'function' ? text(query, resultsCount, totalItemsCount) : text;
        }
    }
}

/**
 * The autocomplete component's view class. It extends the {@link module:ui/search/text/searchtextview~SearchTextView} class
 * with a floating {@link #resultsView} that shows up when the user starts typing and hides when they blur
 * the component.
 */ class AutocompleteView extends SearchTextView {
    /**
	 * The configuration of the autocomplete view.
	 */ _config;
    /**
	 * @inheritDoc
	 */ constructor(locale, config){
        super(locale, config);
        this._config = config;
        const toPx = toUnit('px');
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-autocomplete'
                ]
            }
        });
        const bindResultsView = this.resultsView.bindTemplate;
        this.resultsView.set('isVisible', false);
        this.resultsView.set('_position', 's');
        this.resultsView.set('_width', 0);
        this.resultsView.extendTemplate({
            attributes: {
                class: [
                    bindResultsView.if('isVisible', 'ck-hidden', (value)=>!value),
                    bindResultsView.to('_position', (value)=>`ck-search__results_${value}`)
                ],
                style: {
                    width: bindResultsView.to('_width', toPx)
                }
            }
        });
        // Update the visibility of the results view when the user focuses or blurs the component.
        // This is also integration for the `resetOnBlur` configuration.
        this.focusTracker.on('change:isFocused', (evt, name, isFocused)=>{
            this._updateResultsVisibility();
            if (isFocused) {
                // Reset the scroll position of the results view whenever the autocomplete reopens.
                this.resultsView.element.scrollTop = 0;
            } else if (config.resetOnBlur) {
                this.queryView.reset();
            }
        });
        // Update the visibility of the results view when the user types in the query field.
        // This is an integration for `queryMinChars` configuration.
        // This is an integration for search results changing length and the #resultsView requiring to be repositioned.
        this.on('search', ()=>{
            this._updateResultsVisibility();
            this._updateResultsViewWidthAndPosition();
        });
        // Hide the results view when the user presses the ESC key.
        this.keystrokes.set('esc', (evt, cancel)=>{
            // Let the DOM event pass through if the focus is in the query view.
            if (!this.resultsView.isVisible) {
                return;
            }
            // Focus the query view first and only then close the results view. Otherwise, if the focus
            // was in the results view, it will get lost.
            this.queryView.focus();
            this.resultsView.isVisible = false;
            cancel();
        });
        // Update the position of the results view when the user scrolls the page.
        // TODO: This needs to be debounced down the road.
        this.listenTo(global.document, 'scroll', ()=>{
            this._updateResultsViewWidthAndPosition();
        });
        // Hide the results when the component becomes disabled.
        this.on('change:isEnabled', ()=>{
            this._updateResultsVisibility();
        });
        // Update the value of the query field when the user selects a result.
        this.filteredView.on('execute', (evt, { value })=>{
            // Focus the query view first to avoid losing the focus.
            this.focus();
            // Resetting the view will ensure that the #queryView will update its empty state correctly.
            // This prevents bugs related to dynamic labels or auto-grow when re-setting the same value
            // to #queryView.fieldView.value (which does not trigger empty state change) to an
            // #queryView.fieldView.element that has been changed by the user.
            this.reset();
            // Update the value of the query field.
            this.queryView.fieldView.value = this.queryView.fieldView.element.value = value;
            // Finally, hide the results view. The focus has been moved earlier so this is safe.
            this.resultsView.isVisible = false;
        });
        // Update the position and width of the results view when it becomes visible.
        this.resultsView.on('change:isVisible', ()=>{
            this._updateResultsViewWidthAndPosition();
        });
    }
    /**
	 * Updates the position of the results view on demand.
	 */ _updateResultsViewWidthAndPosition() {
        if (!this.resultsView.isVisible) {
            return;
        }
        this.resultsView._width = new Rect(this.queryView.fieldView.element).width;
        const optimalResultsPosition = AutocompleteView._getOptimalPosition({
            element: this.resultsView.element,
            target: this.queryView.element,
            fitInViewport: true,
            positions: AutocompleteView.defaultResultsPositions
        });
        // _getOptimalPosition will return null if there is no optimal position found (e.g. target is off the viewport).
        this.resultsView._position = optimalResultsPosition ? optimalResultsPosition.name : 's';
    }
    /**
	 * Updates the visibility of the results view on demand.
	 */ _updateResultsVisibility() {
        const queryMinChars = typeof this._config.queryMinChars === 'undefined' ? 0 : this._config.queryMinChars;
        const queryLength = this.queryView.fieldView.element.value.length;
        this.resultsView.isVisible = this.focusTracker.isFocused && this.isEnabled && queryLength >= queryMinChars;
    }
    /**
	 * Positions for the autocomplete results view. Two positions are defined by default:
	 * * `s` - below the search field,
	 * * `n` - above the search field.
	 */ static defaultResultsPositions = [
        (fieldRect)=>{
            return {
                top: fieldRect.bottom,
                left: fieldRect.left,
                name: 's'
            };
        },
        (fieldRect, resultsRect)=>{
            return {
                top: fieldRect.top - resultsRect.height,
                left: fieldRect.left,
                name: 'n'
            };
        }
    ];
    /**
	 * A function used to calculate the optimal position for the dropdown panel.
	 */ static _getOptimalPosition = getOptimalPosition;
}

/**
 * A class representing a view that displays a text which subset can be highlighted using the
 * {@link #highlightText} method.
 */ class HighlightedTextView extends View {
    /**
	 * @inheritDoc
	 */ constructor(){
        super();
        this.set('text', undefined);
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-highlighted-text'
                ]
            }
        });
        this.on('render', ()=>{
            // Classic setTemplate binding for #text will not work because highlightText() replaces the
            // pre-rendered DOM text node new a new one (and <mark> elements).
            this.on('change:text', ()=>{
                this._updateInnerHTML(this.text);
            });
            this._updateInnerHTML(this.text);
        });
    }
    /**
	 * Highlights view's {@link #text} according to the specified `RegExp`. If the passed RegExp is `null`, the
	 * highlighting is removed
	 *
	 * @param regExp
	 */ highlightText(regExp) {
        this._updateInnerHTML(markText(this.text || '', regExp));
    }
    /**
	 * Updates element's `innerHTML` with the passed content.
	 */ _updateInnerHTML(newInnerHTML) {
        this.element.innerHTML = newInnerHTML || '';
    }
}
/**
 * Replaces `regExp` occurrences with `<mark>` tags in a text.
 *
 * @param text A text to get marked.
 * @param regExp An optional `RegExp`. If not passed, this is a pass-through function.
 * @returns A text with `RegExp` occurrences marked by `<mark>`.
 */ function markText(text, regExp) {
    if (!regExp) {
        return escape(text);
    }
    const textParts = [];
    let lastMatchEnd = 0;
    let matchInfo = regExp.exec(text);
    // Iterate over all matches and create an array of text parts. The idea is to mark which parts are query matches
    // so that later on they can be highlighted.
    while(matchInfo !== null){
        const curMatchStart = matchInfo.index;
        // Detect if there was something between last match and this one.
        if (curMatchStart !== lastMatchEnd) {
            textParts.push({
                text: text.substring(lastMatchEnd, curMatchStart),
                isMatch: false
            });
        }
        textParts.push({
            text: matchInfo[0],
            isMatch: true
        });
        lastMatchEnd = regExp.lastIndex;
        matchInfo = regExp.exec(text);
    }
    // Your match might not be the last part of a string. Be sure to add any plain text following the last match.
    if (lastMatchEnd !== text.length) {
        textParts.push({
            text: text.substring(lastMatchEnd),
            isMatch: false
        });
    }
    const outputHtml = textParts// The entire text should be escaped.
    .map((part)=>{
        part.text = escape(part.text);
        return part;
    })// Only matched text should be wrapped with HTML mark element.
    .map((part)=>part.isMatch ? `<mark>${part.text}</mark>` : part.text).join('');
    return outputHtml;
}

/**
 * The spinner view class.
 */ class SpinnerView extends View {
    /**
	 * @inheritDoc
	 */ constructor(){
        super();
        this.set('isVisible', false);
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-spinner-container',
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ]
            },
            children: [
                {
                    tag: 'span',
                    attributes: {
                        class: [
                            'ck',
                            'ck-spinner'
                        ]
                    }
                }
            ]
        });
    }
}

const toPx$2 = /* #__PURE__ */ toUnit('px');
/**
 * The contextual toolbar.
 *
 * It uses the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon plugin}.
 */ class BalloonToolbar extends Plugin {
    /**
	 * The toolbar view displayed in the balloon.
	 */ toolbarView;
    /**
	 * Tracks the focus of the {@link module:ui/editorui/editorui~EditorUI#getEditableElement editable element}
	 * and the {@link #toolbarView}. When both are blurred then the toolbar should hide.
	 */ focusTracker;
    /**
	 * A cached and normalized `config.balloonToolbar` object.
	 */ _balloonConfig;
    /**
	 * An instance of the resize observer that allows to respond to changes in editable's geometry
	 * so the toolbar can stay within its boundaries (and group toolbar items that do not fit).
	 *
	 * **Note**: Used only when `shouldNotGroupWhenFull` was **not** set in the
	 * {@link module:core/editor/editorconfig~EditorConfig#balloonToolbar configuration}.
	 *
	 * **Note:** Created in {@link #init}.
	 */ _resizeObserver = null;
    /**
	 * The contextual balloon plugin instance.
	 */ _balloon;
    /**
	 * Fires `_selectionChangeDebounced` event using `lodash#debounce`.
	 *
	 * This event is an internal plugin event which is fired 200 ms after model selection last change.
	 * This is to makes easy test debounced action without need to use `setTimeout`.
	 *
	 * This function is stored as a plugin property to make possible to cancel
	 * trailing debounced invocation on destroy.
	 */ _fireSelectionChangeDebounced;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'BalloonToolbar';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ContextualBalloon
        ];
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        this._balloonConfig = normalizeToolbarConfig(editor.config.get('balloonToolbar'));
        this.toolbarView = this._createToolbarView();
        this.focusTracker = new FocusTracker();
        // Wait for the EditorUI#init. EditableElement is not available before.
        editor.ui.once('ready', ()=>{
            this.focusTracker.add(editor.ui.getEditableElement());
            this.focusTracker.add(this.toolbarView.element);
        });
        // Register the toolbar so it becomes available for Alt+F10 and Esc navigation.
        editor.ui.addToolbar(this.toolbarView, {
            beforeFocus: ()=>this.show(true),
            afterBlur: ()=>this.hide(),
            isContextual: true
        });
        this._balloon = editor.plugins.get(ContextualBalloon);
        this._fireSelectionChangeDebounced = debounce(()=>this.fire('_selectionChangeDebounced'), 200);
        // The appearance of the BalloonToolbar method is event–driven.
        // It is possible to stop the #show event and this prevent the toolbar from showing up.
        this.decorate('show');
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        // Show/hide the toolbar on editable focus/blur.
        this.listenTo(this.focusTracker, 'change:isFocused', (evt, name, isFocused)=>{
            const isToolbarVisible = this._balloon.visibleView === this.toolbarView;
            if (!isFocused && isToolbarVisible) {
                this.hide();
            } else if (isFocused) {
                this.show();
            }
        });
        // Hide the toolbar when the selection is changed by a direct change or has changed to collapsed.
        this.listenTo(selection, 'change:range', (evt, data)=>{
            if (data.directChange || selection.isCollapsed) {
                this.hide();
            }
            // Fire internal `_selectionChangeDebounced` event to use it for showing
            // the toolbar after the selection stops changing.
            this._fireSelectionChangeDebounced();
        });
        // Show the toolbar when the selection stops changing.
        this.listenTo(this, '_selectionChangeDebounced', ()=>{
            if (this.editor.editing.view.document.isFocused) {
                this.show();
            }
        });
        if (!this._balloonConfig.shouldNotGroupWhenFull) {
            this.listenTo(editor, 'ready', ()=>{
                const editableElement = editor.ui.view.editable.element;
                // Set #toolbarView's max-width on the initialization and update it on the editable resize.
                this._resizeObserver = new ResizeObserver(editableElement, (entry)=>{
                    // The max-width equals 90% of the editable's width for the best user experience.
                    // The value keeps the balloon very close to the boundaries of the editable and limits the cases
                    // when the balloon juts out from the editable element it belongs to.
                    this.toolbarView.maxWidth = toPx$2(entry.contentRect.width * .9);
                });
            });
        }
        // Listen to the toolbar view and whenever it changes its geometry due to some items being
        // grouped or ungrouped, update the position of the balloon because a shorter/longer toolbar
        // means the balloon could be pointing at the wrong place. Once updated, the balloon will point
        // at the right selection in the content again.
        // https://github.com/ckeditor/ckeditor5/issues/6444
        this.listenTo(this.toolbarView, 'groupedItemsUpdate', ()=>{
            this._updatePosition();
        });
        // Creates toolbar components based on given configuration.
        // This needs to be done when all plugins are ready.
        editor.ui.once('ready', ()=>{
            this.toolbarView.fillFromConfig(this._balloonConfig, this.editor.ui.componentFactory);
        });
    }
    /**
	 * Creates the toolbar view instance.
	 */ _createToolbarView() {
        const t = this.editor.locale.t;
        const shouldGroupWhenFull = !this._balloonConfig.shouldNotGroupWhenFull;
        const toolbarView = new ToolbarView(this.editor.locale, {
            shouldGroupWhenFull,
            isFloating: true
        });
        toolbarView.ariaLabel = t('Editor contextual toolbar');
        toolbarView.render();
        return toolbarView;
    }
    /**
	 * Shows the toolbar and attaches it to the selection.
	 *
	 * Fires {@link #event:show} event which can be stopped to prevent the toolbar from showing up.
	 *
	 * @param showForCollapsedSelection When set `true`, the toolbar will show despite collapsed selection in the
	 * editing view.
	 */ show(showForCollapsedSelection = false) {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        const schema = editor.model.schema;
        // Do not add the toolbar to the balloon stack twice.
        if (this._balloon.hasView(this.toolbarView)) {
            return;
        }
        // Do not show the toolbar when the selection is collapsed.
        if (selection.isCollapsed && !showForCollapsedSelection) {
            return;
        }
        // Do not show the toolbar when there is more than one range in the selection and they fully contain selectable elements.
        // See https://github.com/ckeditor/ckeditor5/issues/6443.
        if (selectionContainsOnlyMultipleSelectables(selection, schema)) {
            return;
        }
        // Don not show the toolbar when all components inside are disabled
        // see https://github.com/ckeditor/ckeditor5-ui/issues/269.
        if (Array.from(this.toolbarView.items).every((item)=>item.isEnabled !== undefined && !item.isEnabled)) {
            return;
        }
        // Update the toolbar position when the editor ui should be refreshed.
        this.listenTo(this.editor.ui, 'update', ()=>{
            this._updatePosition();
        });
        // Add the toolbar to the common editor contextual balloon.
        this._balloon.add({
            view: this.toolbarView,
            position: this._getBalloonPositionData(),
            balloonClassName: 'ck-toolbar-container'
        });
    }
    /**
	 * Hides the toolbar.
	 */ hide() {
        if (this._balloon.hasView(this.toolbarView)) {
            this.stopListening(this.editor.ui, 'update');
            this._balloon.remove(this.toolbarView);
        }
    }
    /**
	 * Returns positioning options for the {@link #_balloon}. They control the way balloon is attached
	 * to the selection.
	 */ _getBalloonPositionData() {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;
        const viewSelection = viewDocument.selection;
        // Get direction of the selection.
        const isBackward = viewDocument.selection.isBackward;
        return {
            // Because the target for BalloonPanelView is a Rect (not DOMRange), it's geometry will stay fixed
            // as the window scrolls. To let the BalloonPanelView follow such Rect, is must be continuously
            // computed and hence, the target is defined as a function instead of a static value.
            // https://github.com/ckeditor/ckeditor5-ui/issues/195
            target: ()=>{
                const range = isBackward ? viewSelection.getFirstRange() : viewSelection.getLastRange();
                const rangeRects = Rect.getDomRangeRects(view.domConverter.viewRangeToDom(range));
                // Select the proper range rect depending on the direction of the selection.
                if (isBackward) {
                    return rangeRects[0];
                } else {
                    // Ditch the zero-width "orphan" rect in the next line for the forward selection if there's
                    // another one preceding it. It is not rendered as a selection by the web browser anyway.
                    // https://github.com/ckeditor/ckeditor5-ui/issues/308
                    if (rangeRects.length > 1 && rangeRects[rangeRects.length - 1].width === 0) {
                        rangeRects.pop();
                    }
                    return rangeRects[rangeRects.length - 1];
                }
            },
            positions: this._getBalloonPositions(isBackward)
        };
    }
    /**
	 * Updates the position of the {@link #_balloon} to make up for changes:
	 *
	 * * in the geometry of the selection it is attached to (e.g. the selection moved in the viewport or expanded or shrunk),
	 * * or the geometry of the balloon toolbar itself (e.g. the toolbar has grouped or ungrouped some items and it is shorter or longer).
	 */ _updatePosition() {
        this._balloon.updatePosition(this._getBalloonPositionData());
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        this.stopListening();
        this._fireSelectionChangeDebounced.cancel();
        this.toolbarView.destroy();
        this.focusTracker.destroy();
        if (this._resizeObserver) {
            this._resizeObserver.destroy();
        }
    }
    /**
	 * Returns toolbar positions for the given direction of the selection.
	 */ _getBalloonPositions(isBackward) {
        const isSafariIniOS = env.isSafari && env.isiOS;
        // https://github.com/ckeditor/ckeditor5/issues/7707
        const positions = isSafariIniOS ? BalloonPanelView.generatePositions({
            // 20px when zoomed out. Less then 20px when zoomed in; the "radius" of the native selection handle gets
            // smaller as the user zooms in. No less than the default v-offset, though.
            heightOffset: Math.max(BalloonPanelView.arrowHeightOffset, Math.round(20 / global.window.visualViewport.scale))
        }) : BalloonPanelView.defaultPositions;
        return isBackward ? [
            positions.northWestArrowSouth,
            positions.northWestArrowSouthWest,
            positions.northWestArrowSouthEast,
            positions.northWestArrowSouthMiddleEast,
            positions.northWestArrowSouthMiddleWest,
            positions.southWestArrowNorth,
            positions.southWestArrowNorthWest,
            positions.southWestArrowNorthEast,
            positions.southWestArrowNorthMiddleWest,
            positions.southWestArrowNorthMiddleEast
        ] : [
            positions.southEastArrowNorth,
            positions.southEastArrowNorthEast,
            positions.southEastArrowNorthWest,
            positions.southEastArrowNorthMiddleEast,
            positions.southEastArrowNorthMiddleWest,
            positions.northEastArrowSouth,
            positions.northEastArrowSouthEast,
            positions.northEastArrowSouthWest,
            positions.northEastArrowSouthMiddleEast,
            positions.northEastArrowSouthMiddleWest
        ];
    }
}
/**
 * Returns "true" when the selection has multiple ranges and each range contains a selectable element
 * and nothing else.
 */ function selectionContainsOnlyMultipleSelectables(selection, schema) {
    // It doesn't contain multiple objects if there is only one range.
    if (selection.rangeCount === 1) {
        return false;
    }
    return [
        ...selection.getRanges()
    ].every((range)=>{
        const element = range.getContainedElement();
        return element && schema.isSelectable(element);
    });
}

const toPx$1 = /* #__PURE__ */ toUnit('px');
/**
 * The block button view class.
 *
 * This view represents a button attached next to block element where the selection is anchored.
 *
 * See {@link module:ui/toolbar/block/blocktoolbar~BlockToolbar}.
 */ class BlockButtonView extends ButtonView {
    /**
	 * @inheritDoc
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        // Hide button on init.
        this.isVisible = false;
        this.isToggleable = true;
        this.set('top', 0);
        this.set('left', 0);
        this.extendTemplate({
            attributes: {
                class: 'ck-block-toolbar-button',
                style: {
                    top: bind.to('top', (val)=>toPx$1(val)),
                    left: bind.to('left', (val)=>toPx$1(val))
                }
            }
        });
    }
}

const toPx = /* #__PURE__ */ toUnit('px');
/**
 * The block toolbar plugin.
 *
 * This plugin provides a button positioned next to the block of content where the selection is anchored.
 * Upon clicking the button, a dropdown providing access to editor features shows up, as configured in
 * {@link module:core/editor/editorconfig~EditorConfig#blockToolbar}.
 *
 * By default, the button is displayed next to all elements marked in {@link module:engine/model/schema~Schema}
 * as `$block` for which the toolbar provides at least one option.
 *
 * By default, the button is attached so its right boundary is touching the
 * {@link module:engine/view/editableelement~EditableElement}:
 *
 * ```
 *  __ |
 * |  ||  This is a block of content that the
 *  ¯¯ |  button is attached to. This is a
 *     |  block of content that the button is
 *     |  attached to.
 * ```
 *
 * The position of the button can be adjusted using the CSS `transform` property:
 *
 * ```css
 * .ck-block-toolbar-button {
 * 	transform: translateX( -10px );
 * }
 * ```
 *
 * ```
 *  __   |
 * |  |  |  This is a block of content that the
 *  ¯¯   |  button is attached to. This is a
 *       |  block of content that the button is
 *       |  attached to.
 * ```
 *
 * **Note**: If you plan to run the editor in a right–to–left (RTL) language, keep in mind the button
 * will be attached to the **right** boundary of the editable area. In that case, make sure the
 * CSS position adjustment works properly by adding the following styles:
 *
 * ```css
 * .ck[dir="rtl"] .ck-block-toolbar-button {
 * 	transform: translateX( 10px );
 * }
 * ```
 */ class BlockToolbar extends Plugin {
    /**
	 * The toolbar view.
	 */ toolbarView;
    /**
	 * The balloon panel view, containing the {@link #toolbarView}.
	 */ panelView;
    /**
	 * The button view that opens the {@link #toolbarView}.
	 */ buttonView;
    /**
	 * An instance of the resize observer that allows to respond to changes in editable's geometry
	 * so the toolbar can stay within its boundaries (and group toolbar items that do not fit).
	 *
	 * **Note**: Used only when `shouldNotGroupWhenFull` was **not** set in the
	 * {@link module:core/editor/editorconfig~EditorConfig#blockToolbar configuration}.
	 */ _resizeObserver = null;
    /**
	 * A cached and normalized `config.blockToolbar` object.
	 */ _blockToolbarConfig;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'BlockToolbar';
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        this._blockToolbarConfig = normalizeToolbarConfig(this.editor.config.get('blockToolbar'));
        this.toolbarView = this._createToolbarView();
        this.panelView = this._createPanelView();
        this.buttonView = this._createButtonView();
        // Close the #panelView upon clicking outside of the plugin UI.
        clickOutsideHandler({
            emitter: this.panelView,
            contextElements: [
                this.panelView.element,
                this.buttonView.element
            ],
            activator: ()=>this.panelView.isVisible,
            callback: ()=>this._hidePanel()
        });
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.t;
        const editBlockText = t('Click to edit block');
        const dragToMoveText = t('Drag to move');
        const editBlockLabel = t('Edit block');
        const isDragDropBlockToolbarPluginLoaded = editor.plugins.has('DragDropBlockToolbar');
        const label = isDragDropBlockToolbarPluginLoaded ? `${editBlockText}\n${dragToMoveText}` : editBlockLabel;
        this.buttonView.label = label;
        if (isDragDropBlockToolbarPluginLoaded) {
            this.buttonView.element.dataset.ckeTooltipClass = 'ck-tooltip_multi-line';
        }
        // Hides panel on a direct selection change.
        this.listenTo(editor.model.document.selection, 'change:range', (evt, data)=>{
            if (data.directChange) {
                this._hidePanel();
            }
        });
        this.listenTo(editor.ui, 'update', ()=>this._updateButton());
        // `low` priority is used because of https://github.com/ckeditor/ckeditor5-core/issues/133.
        this.listenTo(editor, 'change:isReadOnly', ()=>this._updateButton(), {
            priority: 'low'
        });
        this.listenTo(editor.ui.focusTracker, 'change:isFocused', ()=>this._updateButton());
        // Reposition button on resize.
        this.listenTo(this.buttonView, 'change:isVisible', (evt, name, isVisible)=>{
            if (isVisible) {
                // Keep correct position of button and panel on window#resize.
                this.buttonView.listenTo(window, 'resize', ()=>this._updateButton());
            } else {
                // Stop repositioning button when is hidden.
                this.buttonView.stopListening(window, 'resize');
                // Hide the panel when the button disappears.
                this._hidePanel();
            }
        });
        // Register the toolbar so it becomes available for Alt+F10 and Esc navigation.
        editor.ui.addToolbar(this.toolbarView, {
            beforeFocus: ()=>this._showPanel(),
            afterBlur: ()=>this._hidePanel()
        });
        // Fills the toolbar with its items based on the configuration.
        // This needs to be done after all plugins are ready.
        editor.ui.once('ready', ()=>{
            this.toolbarView.fillFromConfig(this._blockToolbarConfig, this.editor.ui.componentFactory);
            // Hide panel before executing each button in the panel.
            for (const item of this.toolbarView.items){
                item.on('execute', ()=>this._hidePanel(true), {
                    priority: 'high'
                });
            }
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        // Destroy created UI components as they are not automatically destroyed (see ckeditor5#1341).
        this.panelView.destroy();
        this.buttonView.destroy();
        this.toolbarView.destroy();
        if (this._resizeObserver) {
            this._resizeObserver.destroy();
        }
    }
    /**
	 * Creates the {@link #toolbarView}.
	 */ _createToolbarView() {
        const t = this.editor.locale.t;
        const shouldGroupWhenFull = !this._blockToolbarConfig.shouldNotGroupWhenFull;
        const toolbarView = new ToolbarView(this.editor.locale, {
            shouldGroupWhenFull,
            isFloating: true
        });
        toolbarView.ariaLabel = t('Editor block content toolbar');
        return toolbarView;
    }
    /**
	 * Creates the {@link #panelView}.
	 */ _createPanelView() {
        const editor = this.editor;
        const panelView = new BalloonPanelView(editor.locale);
        panelView.content.add(this.toolbarView);
        panelView.class = 'ck-toolbar-container';
        editor.ui.view.body.add(panelView);
        editor.ui.focusTracker.add(panelView.element);
        // Close #panelView on `Esc` press.
        this.toolbarView.keystrokes.set('Esc', (evt, cancel)=>{
            this._hidePanel(true);
            cancel();
        });
        return panelView;
    }
    /**
	 * Creates the {@link #buttonView}.
	 */ _createButtonView() {
        const editor = this.editor;
        const t = editor.t;
        const buttonView = new BlockButtonView(editor.locale);
        const iconFromConfig = this._blockToolbarConfig.icon;
        const icon = NESTED_TOOLBAR_ICONS[iconFromConfig] || iconFromConfig || NESTED_TOOLBAR_ICONS.dragIndicator;
        buttonView.set({
            label: t('Edit block'),
            icon,
            withText: false
        });
        // Bind the panelView observable properties to the buttonView.
        buttonView.bind('isOn').to(this.panelView, 'isVisible');
        buttonView.bind('tooltip').to(this.panelView, 'isVisible', (isVisible)=>!isVisible);
        // Toggle the panelView upon buttonView#execute.
        this.listenTo(buttonView, 'execute', ()=>{
            if (!this.panelView.isVisible) {
                this._showPanel();
            } else {
                this._hidePanel(true);
            }
        });
        editor.ui.view.body.add(buttonView);
        editor.ui.focusTracker.add(buttonView.element);
        return buttonView;
    }
    /**
	 * Shows or hides the button.
	 * When all the conditions for displaying the button are matched, it shows the button. Hides otherwise.
	 */ _updateButton() {
        const editor = this.editor;
        const model = editor.model;
        const view = editor.editing.view;
        // Hides the button when the editor is not focused.
        if (!editor.ui.focusTracker.isFocused) {
            this._hideButton();
            return;
        }
        // Hides the button when the selection is in non-editable place.
        if (!editor.model.canEditAt(editor.model.document.selection)) {
            this._hideButton();
            return;
        }
        // Get the first selected block, button will be attached to this element.
        const modelTarget = Array.from(model.document.selection.getSelectedBlocks())[0];
        // Hides the button when there is no enabled item in toolbar for the current block element.
        if (!modelTarget || Array.from(this.toolbarView.items).every((item)=>!item.isEnabled)) {
            this._hideButton();
            return;
        }
        // Get DOM target element.
        const domTarget = view.domConverter.mapViewToDom(editor.editing.mapper.toViewElement(modelTarget));
        // Show block button.
        this.buttonView.isVisible = true;
        // Make sure that the block toolbar panel is resized properly.
        this._setupToolbarResize();
        // Attach block button to target DOM element.
        this._attachButtonToElement(domTarget);
        // When panel is opened then refresh it position to be properly aligned with block button.
        if (this.panelView.isVisible) {
            this._showPanel();
        }
    }
    /**
	 * Hides the button.
	 */ _hideButton() {
        this.buttonView.isVisible = false;
    }
    /**
	 * Shows the {@link #toolbarView} attached to the {@link #buttonView}.
	 * If the toolbar is already visible, then it simply repositions it.
	 */ _showPanel() {
        // Usually, the only way to show the toolbar is by pressing the block button. It makes it impossible for
        // the toolbar to show up when the button is invisible (feature does not make sense for the selection then).
        // The toolbar navigation using Alt+F10 does not access the button but shows the panel directly using this method.
        // So we need to check whether this is possible first.
        if (!this.buttonView.isVisible) {
            return;
        }
        const wasVisible = this.panelView.isVisible;
        // So here's the thing: If there was no initial panelView#show() or these two were in different order, the toolbar
        // positioning will break in RTL editors. Weird, right? What you show know is that the toolbar
        // grouping works thanks to:
        //
        // * the ResizeObserver, which kicks in as soon as the toolbar shows up in DOM (becomes visible again).
        // * the observable ToolbarView#maxWidth, which triggers re-grouping when changed.
        //
        // Here are the possible scenarios:
        //
        // 1. (WRONG ❌) If the #maxWidth is set when the toolbar is invisible, it won't affect item grouping (no DOMRects, no grouping).
        //    Then, when panelView.pin() is called, the position of the toolbar will be calculated for the old
        //    items grouping state, and when finally ResizeObserver kicks in (hey, the toolbar is visible now, right?)
        //    it will group/ungroup some items and the length of the toolbar will change. But since in RTL the toolbar
        //    is attached on the right side and the positioning uses CSS "left", it will result in the toolbar shifting
        //    to the left and being displayed in the wrong place.
        // 2. (WRONG ❌) If the panelView.pin() is called first and #maxWidth set next, then basically the story repeats. The balloon
        //    calculates the position for the old toolbar grouping state, then the toolbar re-groups items and because
        //    it is positioned using CSS "left" it will move.
        // 3. (RIGHT ✅) We show the panel first (the toolbar does re-grouping but it does not matter), then the #maxWidth
        //    is set allowing the toolbar to re-group again and finally panelView.pin() does the positioning when the
        //    items grouping state is stable and final.
        //
        // https://github.com/ckeditor/ckeditor5/issues/6449, https://github.com/ckeditor/ckeditor5/issues/6575
        this.panelView.show();
        const editableElement = this._getSelectedEditableElement();
        this.toolbarView.maxWidth = this._getToolbarMaxWidth(editableElement);
        this.panelView.pin({
            target: this.buttonView.element,
            limiter: editableElement
        });
        if (!wasVisible) {
            this.toolbarView.items.get(0).focus();
        }
    }
    /**
	 * Returns currently selected editable, based on the model selection.
	 */ _getSelectedEditableElement() {
        const selectedModelRootName = this.editor.model.document.selection.getFirstRange().root.rootName;
        return this.editor.ui.getEditableElement(selectedModelRootName);
    }
    /**
	 * Hides the {@link #toolbarView}.
	 *
	 * @param focusEditable When `true`, the editable will be focused after hiding the panel.
	 */ _hidePanel(focusEditable) {
        this.panelView.isVisible = false;
        if (focusEditable) {
            this.editor.editing.view.focus();
        }
    }
    /**
	 * Attaches the {@link #buttonView} to the target block of content.
	 *
	 * @param targetElement Target element.
	 */ _attachButtonToElement(targetElement) {
        const contentStyles = window.getComputedStyle(targetElement);
        const editableRect = new Rect(this._getSelectedEditableElement());
        const contentPaddingTop = parseInt(contentStyles.paddingTop, 10);
        // When line height is not an integer then treat it as "normal".
        // MDN says that 'normal' == ~1.2 on desktop browsers.
        const contentLineHeight = parseInt(contentStyles.lineHeight, 10) || parseInt(contentStyles.fontSize, 10) * 1.2;
        const buttonRect = new Rect(this.buttonView.element);
        const contentRect = new Rect(targetElement);
        let positionLeft;
        if (this.editor.locale.uiLanguageDirection === 'ltr') {
            positionLeft = editableRect.left - buttonRect.width;
        } else {
            positionLeft = editableRect.right;
        }
        const positionTop = contentRect.top + contentPaddingTop + (contentLineHeight - buttonRect.height) / 2;
        buttonRect.moveTo(positionLeft, positionTop);
        const absoluteButtonRect = buttonRect.toAbsoluteRect();
        this.buttonView.top = absoluteButtonRect.top;
        this.buttonView.left = absoluteButtonRect.left;
    }
    /**
	 * Creates a resize observer that observes selected editable and resizes the toolbar panel accordingly.
	 */ _setupToolbarResize() {
        const editableElement = this._getSelectedEditableElement();
        // Do this only if the automatic grouping is turned on.
        if (!this._blockToolbarConfig.shouldNotGroupWhenFull) {
            // If resize observer is attached to a different editable than currently selected editable, re-attach it.
            if (this._resizeObserver && this._resizeObserver.element !== editableElement) {
                this._resizeObserver.destroy();
                this._resizeObserver = null;
            }
            if (!this._resizeObserver) {
                this._resizeObserver = new ResizeObserver(editableElement, ()=>{
                    this.toolbarView.maxWidth = this._getToolbarMaxWidth(editableElement);
                });
            }
        }
    }
    /**
	 * Gets the {@link #toolbarView} max-width, based on given `editableElement` width plus the distance between the farthest
	 * edge of the {@link #buttonView} and the editable.
	 *
	 * @returns A maximum width that toolbar can have, in pixels.
	 */ _getToolbarMaxWidth(editableElement) {
        const editableRect = new Rect(editableElement);
        const buttonRect = new Rect(this.buttonView.element);
        const isRTL = this.editor.locale.uiLanguageDirection === 'rtl';
        const offset = isRTL ? buttonRect.left - editableRect.right + buttonRect.width : editableRect.left - buttonRect.left;
        return toPx(editableRect.width + offset);
    }
}

/**
 * A menu {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#buttonView} class. Buttons like this one
 * open both top-level bar menus as well as sub-menus.
 */ class MenuBarMenuButtonView extends ButtonView {
    /**
	 * An icon that displays an arrow to indicate a direction of the menu.
	 */ arrowView;
    /**
	 * Creates an instance of the menu bar button view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set({
            withText: true,
            role: 'menuitem'
        });
        this.arrowView = this._createArrowView();
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-menu-bar__menu__button'
                ],
                'aria-haspopup': true,
                'aria-expanded': this.bindTemplate.to('isOn', (value)=>String(value)),
                'data-cke-tooltip-disabled': bind.to('isOn')
            },
            on: {
                'mouseenter': bind.to('mouseenter')
            }
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.children.add(this.arrowView);
    }
    /**
	 * Creates the {@link #arrowView} instance.
	 */ _createArrowView() {
        const arrowView = new IconView();
        arrowView.content = dropdownArrowIcon;
        arrowView.extendTemplate({
            attributes: {
                class: 'ck-menu-bar__menu__button__arrow'
            }
        });
        return arrowView;
    }
}

/**
 * A menu bar list item view, a child of {@link module:ui/menubar/menubarmenulistview~MenuBarMenuListView}.
 *
 * Populate this item with a {@link module:ui/menubar/menubarmenulistitembuttonview~MenuBarMenuListItemButtonView} instance
 * or a {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} instance to create a sub-menu.
 */ class MenuBarMenuListItemView extends ListItemView {
    /**
	 * Creates an instance of the list item view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale, parentMenuView){
        super(locale);
        const bind = this.bindTemplate;
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-menu-bar__menu__item'
                ]
            },
            on: {
                'mouseenter': bind.to('mouseenter')
            }
        });
        this.delegate('mouseenter').to(parentMenuView);
    }
}

const NESTED_PANEL_HORIZONTAL_OFFSET = 5;
/**
 * Behaviors of the {@link module:ui/menubar/menubarview~MenuBarView} component.
 */ const MenuBarBehaviors = {
    /**
	 * When the bar is already open:
	 * * Opens the menu when the user hovers over its button.
	 * * Closes open menu when another menu's button gets hovered.
	 */ toggleMenusAndFocusItemsOnHover (menuBarView) {
        menuBarView.on('menu:mouseenter', (evt)=>{
            // This works only when the menu bar has already been open and the user hover over the menu bar.
            if (!menuBarView.isOpen) {
                return;
            }
            for (const menuView of menuBarView.menus){
                // @if CK_DEBUG_MENU_BAR // const wasOpen = menuView.isOpen;
                const pathLeaf = evt.path[0];
                const isListItemContainingMenu = pathLeaf instanceof MenuBarMenuListItemView && pathLeaf.children.first === menuView;
                menuView.isOpen = (evt.path.includes(menuView) || isListItemContainingMenu) && menuView.isEnabled;
            // @if CK_DEBUG_MENU_BAR // if ( wasOpen !== menuView.isOpen ) {
            // @if CK_DEBUG_MENU_BAR // console.log( '[BEHAVIOR] toggleMenusAndFocusItemsOnHover(): Toggle',
            // @if CK_DEBUG_MENU_BAR // 	logMenu( menuView ), 'isOpen', menuView.isOpen
            // @if CK_DEBUG_MENU_BAR // );
            // @if CK_DEBUG_MENU_BAR // }
            }
            evt.source.focus();
        });
    },
    /**
	 * Moves between top-level menus using the arrow left and right keys.
	 *
	 * If the menubar has already been open, the arrow keys move focus between top-level menu buttons and open them.
	 * If the menubar is closed, the arrow keys only move focus between top-level menu buttons.
	 */ focusCycleMenusOnArrows (menuBarView) {
        const isContentRTL = menuBarView.locale.uiLanguageDirection === 'rtl';
        menuBarView.on('menu:arrowright', (evt)=>{
            cycleTopLevelMenus(evt.source, isContentRTL ? -1 : 1);
        });
        menuBarView.on('menu:arrowleft', (evt)=>{
            cycleTopLevelMenus(evt.source, isContentRTL ? 1 : -1);
        });
        function cycleTopLevelMenus(currentMenuView, step) {
            const currentIndex = menuBarView.children.getIndex(currentMenuView);
            const isCurrentMenuViewOpen = currentMenuView.isOpen;
            const menusCount = menuBarView.children.length;
            const menuViewToOpen = menuBarView.children.get((currentIndex + menusCount + step) % menusCount);
            currentMenuView.isOpen = false;
            if (isCurrentMenuViewOpen) {
                menuViewToOpen.isOpen = true;
            }
            menuViewToOpen.buttonView.focus();
        }
    },
    /**
	 * Closes the entire sub-menu structure when the bar is closed. This prevents sub-menus from being open if the user
	 * closes the entire bar, and then re-opens some top-level menu.
	 */ closeMenusWhenTheBarCloses (menuBarView) {
        menuBarView.on('change:isOpen', ()=>{
            if (!menuBarView.isOpen) {
                menuBarView.menus.forEach((menuView)=>{
                    menuView.isOpen = false;
                // @if CK_DEBUG_MENU_BAR // console.log( '[BEHAVIOR] closeMenusWhenTheBarCloses(): Closing', logMenu( menuView ) );
                });
            }
        });
    },
    /**
	 * Handles the following case:
	 * 1. Hover to open a sub-menu (A). The button has focus.
	 * 2. Press arrow up/down to move focus to another sub-menu (B) button.
	 * 3. Press arrow right to open the sub-menu (B).
	 * 4. The sub-menu (A) should close as it would with `toggleMenusAndFocusItemsOnHover()`.
	 */ closeMenuWhenAnotherOnTheSameLevelOpens (menuBarView) {
        menuBarView.on('menu:change:isOpen', (evt, name, isOpen)=>{
            if (isOpen) {
                menuBarView.menus.filter((menuView)=>{
                    return evt.source.parentMenuView === menuView.parentMenuView && evt.source !== menuView && menuView.isOpen;
                }).forEach((menuView)=>{
                    menuView.isOpen = false;
                // @if CK_DEBUG_MENU_BAR // console.log( '[BEHAVIOR] closeMenuWhenAnotherOpens(): Closing', logMenu( menuView ) );
                });
            }
        });
    },
    /**
	 * Closes the bar when the user clicked outside of it (page body, editor root, etc.).
	 */ closeOnClickOutside (menuBarView) {
        clickOutsideHandler({
            emitter: menuBarView,
            activator: ()=>menuBarView.isOpen,
            callback: ()=>menuBarView.close(),
            contextElements: ()=>menuBarView.children.map((child)=>child.element)
        });
    }
};
/**
 * Behaviors of the {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} component.
 */ const MenuBarMenuBehaviors = {
    /**
	 * If the button of the menu is focused, pressing the arrow down key should open the panel and focus it.
	 * This is analogous to the {@link module:ui/dropdown/dropdownview~DropdownView}.
	 */ openAndFocusPanelOnArrowDownKey (menuView) {
        menuView.keystrokes.set('arrowdown', (data, cancel)=>{
            if (menuView.focusTracker.focusedElement === menuView.buttonView.element) {
                if (!menuView.isOpen) {
                    menuView.isOpen = true;
                }
                menuView.panelView.focus();
                cancel();
            }
        });
    },
    /**
	 * Open the menu on the right arrow key press. This allows for navigating to sub-menus using the keyboard.
	 */ openOnArrowRightKey (menuView) {
        const keystroke = menuView.locale.uiLanguageDirection === 'rtl' ? 'arrowleft' : 'arrowright';
        menuView.keystrokes.set(keystroke, (data, cancel)=>{
            if (menuView.focusTracker.focusedElement !== menuView.buttonView.element || !menuView.isEnabled) {
                return;
            }
            // @if CK_DEBUG_MENU_BAR // console.log( '[BEHAVIOR] openOnArrowRightKey(): Opening', logMenu( menuView ) );
            if (!menuView.isOpen) {
                menuView.isOpen = true;
            }
            menuView.panelView.focus();
            cancel();
        });
    },
    /**
	 * Opens the menu on its button click. Note that this behavior only opens but never closes the menu (unlike
	 * {@link module:ui/dropdown/dropdownview~DropdownView}).
	 */ openOnButtonClick (menuView) {
        menuView.buttonView.on('execute', ()=>{
            menuView.isOpen = true;
            menuView.panelView.focus();
        });
    },
    /**
	 * Toggles the menu on its button click. This behavior is analogous to {@link module:ui/dropdown/dropdownview~DropdownView}.
	 */ toggleOnButtonClick (menuView) {
        menuView.buttonView.on('execute', ()=>{
            menuView.isOpen = !menuView.isOpen;
            if (menuView.isOpen) {
                menuView.panelView.focus();
            }
        });
    },
    /**
	 * Closes the menu on the right left key press. This allows for navigating to sub-menus using the keyboard.
	 */ closeOnArrowLeftKey (menuView) {
        const keystroke = menuView.locale.uiLanguageDirection === 'rtl' ? 'arrowright' : 'arrowleft';
        menuView.keystrokes.set(keystroke, (data, cancel)=>{
            if (menuView.isOpen) {
                menuView.isOpen = false;
                menuView.focus();
                cancel();
            }
        });
    },
    /**
	 * Closes the menu on the esc key press. This allows for navigating to sub-menus using the keyboard.
	 */ closeOnEscKey (menuView) {
        menuView.keystrokes.set('esc', (data, cancel)=>{
            if (menuView.isOpen) {
                menuView.isOpen = false;
                menuView.focus();
                cancel();
            }
        });
    },
    /**
	 * Closes the menu when its parent menu also closed. This prevents from orphaned open menus when the parent menu re-opens.
	 */ closeOnParentClose (menuView) {
        menuView.parentMenuView.on('change:isOpen', (evt, name, isOpen)=>{
            if (!isOpen && evt.source === menuView.parentMenuView) {
                // @if CK_DEBUG_MENU_BAR // console.log( '[BEHAVIOR] closeOnParentClose(): Closing', logMenu( menuView ) );
                menuView.isOpen = false;
            }
        });
    }
};
// @if CK_DEBUG_MENU_BAR // function logMenu( menuView: MenuBarMenuView ) {
// @if CK_DEBUG_MENU_BAR //	return `"${ menuView.buttonView.label }"`;
// @if CK_DEBUG_MENU_BAR // }
/**
 * Contains every positioning function used by {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} that decides where the
 * {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#panelView} should be placed.
 *
 * Top-level menu positioning functions:
 *
 *	┌──────┐
 *	│      │
 *	├──────┴────────┐
 *	│               │
 *	│               │
 *	│               │
 *	│            SE │
 *	└───────────────┘
 *
 *	         ┌──────┐
 *	         │      │
 *	┌────────┴──────┤
 *	│               │
 *	│               │
 *	│               │
 *	│ SW            │
 *	└───────────────┘
 *
 *	┌───────────────┐
 *	│ NW            │
 *	│               │
 *	│               │
 *	│               │
 *	└────────┬──────┤
 *	         │      │
 *	         └──────┘
 *
 *	┌───────────────┐
 *	│            NE │
 *	│               │
 *	│               │
 *	│               │
 *	├──────┬────────┘
 *	│      │
 *	└──────┘
 *
 * Sub-menu positioning functions:
 *
 *	┌──────┬───────────────┐
 *	│      │               │
 *	└──────┤               │
 *	       │               │
 *	       │            ES │
 *	       └───────────────┘
 *
 *	┌───────────────┬──────┐
 *	│               │      │
 *	│               ├──────┘
 *	│               │
 *	│ WS            │
 *	└───────────────┘
 *
 *	       ┌───────────────┐
 *	       │            EN │
 *	       │               │
 *	┌──────┤               │
 *	│      │               │
 *	└──────┴───────────────┘
 *
 *	┌───────────────┐
 *	│ WN            │
 *	│               │
 *	│               ├──────┐
 *	│               │      │
 *	└───────────────┴──────┘
 */ const MenuBarMenuViewPanelPositioningFunctions = {
    southEast: (buttonRect)=>{
        return {
            top: buttonRect.bottom,
            left: buttonRect.left,
            name: 'se'
        };
    },
    southWest: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.bottom,
            left: buttonRect.left - panelRect.width + buttonRect.width,
            name: 'sw'
        };
    },
    northEast: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left,
            name: 'ne'
        };
    },
    northWest: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - panelRect.width + buttonRect.width,
            name: 'nw'
        };
    },
    eastSouth: (buttonRect)=>{
        return {
            top: buttonRect.top,
            left: buttonRect.right - NESTED_PANEL_HORIZONTAL_OFFSET,
            name: 'es'
        };
    },
    eastNorth: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.right - NESTED_PANEL_HORIZONTAL_OFFSET,
            name: 'en'
        };
    },
    westSouth: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.top,
            left: buttonRect.left - panelRect.width + NESTED_PANEL_HORIZONTAL_OFFSET,
            name: 'ws'
        };
    },
    westNorth: (buttonRect, panelRect)=>{
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - panelRect.width + NESTED_PANEL_HORIZONTAL_OFFSET,
            name: 'wn'
        };
    }
};
/**
 * The default items {@link module:core/editor/editorconfig~EditorConfig#menuBar configuration} of the
 * {@link module:ui/menubar/menubarview~MenuBarView} component. It contains names of all menu bar components
 * registered in the {@link module:ui/componentfactory~ComponentFactory component factory} (available in the project).
 *
 * **Note**: Menu bar component names provided by core editor features are prefixed with `menuBar:` in order to distinguish
 * them from components referenced by the {@link module:core/editor/editorconfig~EditorConfig#toolbar toolbar configuration}, for instance,
 * `'menuBar:bold'` is a menu bar button but `'bold'` is a toolbar button.
 *
 * Below is the preset menu bar structure (the default value of `config.menuBar.items` property):
 *
 * ```ts
 * [
 * 	{
 * 		menuId: 'file',
 * 		label: 'File',
 * 		groups: [
 * 			{
 * 				groupId: 'export',
 * 				items: [
 * 					'menuBar:exportPdf',
 * 					'menuBar:exportWord'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'import',
 * 				items: [
 * 					'menuBar:importWord'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'revisionHistory',
 * 				items: [
 * 					'menuBar:revisionHistory'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'edit',
 * 		label: 'Edit',
 * 		groups: [
 * 			{
 * 				groupId: 'undo',
 * 				items: [
 * 					'menuBar:undo',
 * 					'menuBar:redo'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'selectAll',
 * 				items: [
 * 					'menuBar:selectAll'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'findAndReplace',
 * 				items: [
 * 					'menuBar:findAndReplace'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'view',
 * 		label: 'View',
 * 		groups: [
 * 			{
 * 				groupId: 'sourceEditing',
 * 				items: [
 * 					'menuBar:sourceEditing'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'showBlocks',
 * 				items: [
 * 					'menuBar:showBlocks'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'restrictedEditingException',
 * 				items: [
 * 					'menuBar:restrictedEditingException'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'insert',
 * 		label: 'Insert',
 * 		groups: [
 * 			{
 * 				groupId: 'insertMainWidgets',
 * 				items: [
 * 					'menuBar:insertImage',
 * 					'menuBar:ckbox',
 * 					'menuBar:ckfinder',
 * 					'menuBar:insertTable'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'insertInline',
 * 				items: [
 * 					'menuBar:link',
 * 					'menuBar:comment'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'insertMinorWidgets',
 * 				items: [
 * 					'menuBar:mediaEmbed',
 * 					'menuBar:insertTemplate',
 * 					'menuBar:blockQuote',
 * 					'menuBar:codeBlock',
 * 					'menuBar:htmlEmbed'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'insertStructureWidgets',
 * 				items: [
 * 					'menuBar:horizontalLine',
 * 					'menuBar:pageBreak',
 * 					'menuBar:tableOfContents'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'restrictedEditing',
 * 				items: [
 * 					'menuBar:restrictedEditing'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'format',
 * 		label: 'Format',
 * 		groups: [
 * 			{
 * 				groupId: 'textAndFont',
 * 				items: [
 * 					{
 * 						menuId: 'text',
 * 						label: 'Text',
 * 						groups: [
 * 							{
 * 								groupId: 'basicStyles',
 * 								items: [
 * 									'menuBar:bold',
 * 									'menuBar:italic',
 * 									'menuBar:underline',
 * 									'menuBar:strikethrough',
 * 									'menuBar:superscript',
 * 									'menuBar:subscript',
 * 									'menuBar:code'
 * 								]
 * 							},
 * 							{
 * 								groupId: 'textPartLanguage',
 * 								items: [
 * 									'menuBar:textPartLanguage'
 * 								]
 * 							}
 * 						]
 * 					},
 * 					{
 * 						menuId: 'font',
 * 						label: 'Font',
 * 						groups: [
 * 							{
 * 								groupId: 'fontProperties',
 * 								items: [
 * 									'menuBar:fontSize',
 * 									'menuBar:fontFamily'
 * 								]
 * 							},
 * 							{
 * 								groupId: 'fontColors',
 * 								items: [
 * 									'menuBar:fontColor',
 * 									'menuBar:fontBackgroundColor'
 * 								]
 * 							},
 * 							{
 * 								groupId: 'highlight',
 * 								items: [
 * 									'menuBar:highlight'
 * 								]
 * 							}
 * 						]
 * 					},
 * 					'menuBar:heading'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'list',
 * 				items: [
 * 					'menuBar:bulletedList',
 * 					'menuBar:numberedList',
 * 					'menuBar:multiLevelList',
 * 					'menuBar:todoList'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'indent',
 * 				items: [
 * 					'menuBar:alignment',
 * 					'menuBar:indent',
 * 					'menuBar:outdent'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'caseChange',
 * 				items: [
 * 					'menuBar:caseChange'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'removeFormat',
 * 				items: [
 * 					'menuBar:removeFormat'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'tools',
 * 		label: 'Tools',
 * 		groups: [
 * 			{
 * 				groupId: 'aiTools',
 * 				items: [
 * 					'menuBar:aiAssistant',
 * 					'menuBar:aiCommands'
 * 				]
 * 			},
 * 			{
 * 				groupId: 'tools',
 * 				items: [
 * 					'menuBar:trackChanges',
 * 					'menuBar:commentsArchive'
 * 				]
 * 			}
 * 		]
 * 	},
 * 	{
 * 		menuId: 'help',
 * 		label: 'Help',
 * 		groups: [
 * 			{
 * 				groupId: 'help',
 * 				items: [
 * 					'menuBar:accessibilityHelp'
 * 				]
 * 			}
 * 		]
 * 	}
 * ];
 * ```
 *
 * The menu bar can be customized using the `config.menuBar.removeItems` and `config.menuBar.addItems` properties.
 */ // **NOTE: Whenever you make changes to this value, reflect it in the documentation above!**
const DefaultMenuBarItems = [
    {
        menuId: 'file',
        label: 'File',
        groups: [
            {
                groupId: 'export',
                items: [
                    'menuBar:exportPdf',
                    'menuBar:exportWord'
                ]
            },
            {
                groupId: 'import',
                items: [
                    'menuBar:importWord'
                ]
            },
            {
                groupId: 'revisionHistory',
                items: [
                    'menuBar:revisionHistory'
                ]
            }
        ]
    },
    {
        menuId: 'edit',
        label: 'Edit',
        groups: [
            {
                groupId: 'undo',
                items: [
                    'menuBar:undo',
                    'menuBar:redo'
                ]
            },
            {
                groupId: 'selectAll',
                items: [
                    'menuBar:selectAll'
                ]
            },
            {
                groupId: 'findAndReplace',
                items: [
                    'menuBar:findAndReplace'
                ]
            }
        ]
    },
    {
        menuId: 'view',
        label: 'View',
        groups: [
            {
                groupId: 'sourceEditing',
                items: [
                    'menuBar:sourceEditing'
                ]
            },
            {
                groupId: 'showBlocks',
                items: [
                    'menuBar:showBlocks'
                ]
            },
            {
                groupId: 'restrictedEditingException',
                items: [
                    'menuBar:restrictedEditingException'
                ]
            }
        ]
    },
    {
        menuId: 'insert',
        label: 'Insert',
        groups: [
            {
                groupId: 'insertMainWidgets',
                items: [
                    'menuBar:insertImage',
                    'menuBar:ckbox',
                    'menuBar:ckfinder',
                    'menuBar:insertTable'
                ]
            },
            {
                groupId: 'insertInline',
                items: [
                    'menuBar:link',
                    'menuBar:comment'
                ]
            },
            {
                groupId: 'insertMinorWidgets',
                items: [
                    'menuBar:mediaEmbed',
                    'menuBar:insertTemplate',
                    'menuBar:blockQuote',
                    'menuBar:codeBlock',
                    'menuBar:htmlEmbed'
                ]
            },
            {
                groupId: 'insertStructureWidgets',
                items: [
                    'menuBar:horizontalLine',
                    'menuBar:pageBreak',
                    'menuBar:tableOfContents'
                ]
            },
            {
                groupId: 'restrictedEditing',
                items: [
                    'menuBar:restrictedEditing'
                ]
            }
        ]
    },
    {
        menuId: 'format',
        label: 'Format',
        groups: [
            {
                groupId: 'textAndFont',
                items: [
                    {
                        menuId: 'text',
                        label: 'Text',
                        groups: [
                            {
                                groupId: 'basicStyles',
                                items: [
                                    'menuBar:bold',
                                    'menuBar:italic',
                                    'menuBar:underline',
                                    'menuBar:strikethrough',
                                    'menuBar:superscript',
                                    'menuBar:subscript',
                                    'menuBar:code'
                                ]
                            },
                            {
                                groupId: 'textPartLanguage',
                                items: [
                                    'menuBar:textPartLanguage'
                                ]
                            }
                        ]
                    },
                    {
                        menuId: 'font',
                        label: 'Font',
                        groups: [
                            {
                                groupId: 'fontProperties',
                                items: [
                                    'menuBar:fontSize',
                                    'menuBar:fontFamily'
                                ]
                            },
                            {
                                groupId: 'fontColors',
                                items: [
                                    'menuBar:fontColor',
                                    'menuBar:fontBackgroundColor'
                                ]
                            },
                            {
                                groupId: 'highlight',
                                items: [
                                    'menuBar:highlight'
                                ]
                            }
                        ]
                    },
                    'menuBar:heading'
                ]
            },
            {
                groupId: 'list',
                items: [
                    'menuBar:bulletedList',
                    'menuBar:numberedList',
                    'menuBar:multiLevelList',
                    'menuBar:todoList'
                ]
            },
            {
                groupId: 'indent',
                items: [
                    'menuBar:alignment',
                    'menuBar:indent',
                    'menuBar:outdent'
                ]
            },
            {
                groupId: 'caseChange',
                items: [
                    'menuBar:caseChange'
                ]
            },
            {
                groupId: 'removeFormat',
                items: [
                    'menuBar:removeFormat'
                ]
            }
        ]
    },
    {
        menuId: 'tools',
        label: 'Tools',
        groups: [
            {
                groupId: 'aiTools',
                items: [
                    'menuBar:aiAssistant',
                    'menuBar:aiCommands'
                ]
            },
            {
                groupId: 'tools',
                items: [
                    'menuBar:trackChanges',
                    'menuBar:commentsArchive'
                ]
            }
        ]
    },
    {
        menuId: 'help',
        label: 'Help',
        groups: [
            {
                groupId: 'help',
                items: [
                    'menuBar:accessibilityHelp'
                ]
            }
        ]
    }
];
/**
 * Performs a cleanup and normalization of the menu bar configuration.
 */ function normalizeMenuBarConfig(config) {
    let configObject;
    // The integrator specified the config as an object but without items. Let's give them defaults but respect their
    // additions and removals.
    if (!('items' in config) || !config.items) {
        configObject = {
            items: cloneDeep(DefaultMenuBarItems),
            addItems: [],
            removeItems: [],
            isVisible: true,
            isUsingDefaultConfig: true,
            ...config
        };
    } else {
        configObject = {
            items: config.items,
            removeItems: [],
            addItems: [],
            isVisible: true,
            isUsingDefaultConfig: false,
            ...config
        };
    }
    return configObject;
}
/**
 * Processes a normalized menu bar config and returns a config clone with the following modifications:
 *
 * * Removed components that are not available in the component factory,
 * * Removed obsolete separators,
 * * Purged empty menus,
 * * Localized top-level menu labels.
 */ function processMenuBarConfig({ normalizedConfig, locale, componentFactory }) {
    const configClone = cloneDeep(normalizedConfig);
    handleRemovals(normalizedConfig, configClone);
    handleAdditions(normalizedConfig, configClone);
    purgeUnavailableComponents(normalizedConfig, configClone, componentFactory);
    purgeEmptyMenus(normalizedConfig, configClone);
    localizeMenuLabels(configClone, locale);
    return configClone;
}
/**
 * Removes items from the menu bar config based on user `removeItems` configuration. Users can remove
 * individual items, groups, or entire menus. For each removed item, a warning is logged if the item
 * was not found in the configuration.
 */ function handleRemovals(originalConfig, config) {
    const itemsToBeRemoved = config.removeItems;
    const successfullyRemovedItems = [];
    // Remove top-level menus.
    config.items = config.items.filter(({ menuId })=>{
        if (itemsToBeRemoved.includes(menuId)) {
            successfullyRemovedItems.push(menuId);
            return false;
        }
        return true;
    });
    walkConfigMenus(config.items, (menuDefinition)=>{
        // Remove groups from menus.
        menuDefinition.groups = menuDefinition.groups.filter(({ groupId })=>{
            if (itemsToBeRemoved.includes(groupId)) {
                successfullyRemovedItems.push(groupId);
                return false;
            }
            return true;
        });
        // Remove sub-menus and items from groups.
        for (const groupDefinition of menuDefinition.groups){
            groupDefinition.items = groupDefinition.items.filter((item)=>{
                const itemId = getIdFromGroupItem(item);
                if (itemsToBeRemoved.includes(itemId)) {
                    successfullyRemovedItems.push(itemId);
                    return false;
                }
                return true;
            });
        }
    });
    for (const itemName of itemsToBeRemoved){
        if (!successfullyRemovedItems.includes(itemName)) {
            /**
			 * There was a problem processing the configuration of the menu bar. The item with the given
			 * name does could not be removed from the menu bar configuration.
			 *
			 * This warning usually shows up when the {@link module:core/plugin~Plugin} which is supposed
			 * to provide a menu bar item has not been loaded or there is a typo in the
			 * {@link module:core/editor/editorconfig~EditorConfig#menuBar menu bar configuration}.
			 *
			 * @error menu-bar-item-could-not-be-removed
			 * @param menuBarConfig The full configuration of the menu bar.
			 * @param itemName The name of the item that was not removed from the menu bar.
			 */ logWarning('menu-bar-item-could-not-be-removed', {
                menuBarConfig: originalConfig,
                itemName
            });
        }
    }
}
/**
 * Handles the `config.menuBar.addItems` configuration. It allows for adding menus, groups, and items at arbitrary
 * positions in the menu bar. If the position does not exist, a warning is logged.
 */ function handleAdditions(originalConfig, config) {
    const itemsToBeAdded = config.addItems;
    const successFullyAddedItems = [];
    for (const itemToAdd of itemsToBeAdded){
        const relation = getRelationFromPosition(itemToAdd.position);
        const relativeId = getRelativeIdFromPosition(itemToAdd.position);
        // Adding a menu.
        if (isMenuBarMenuAddition(itemToAdd)) {
            if (!relativeId) {
                // Adding a top-level menu at the beginning of the menu bar.
                if (relation === 'start') {
                    config.items.unshift(itemToAdd.menu);
                    successFullyAddedItems.push(itemToAdd);
                } else if (relation === 'end') {
                    config.items.push(itemToAdd.menu);
                    successFullyAddedItems.push(itemToAdd);
                }
            } else {
                const topLevelMenuDefinitionIndex = config.items.findIndex((menuDefinition)=>menuDefinition.menuId === relativeId);
                // Adding a top-level menu somewhere between existing menu bar menus.
                if (topLevelMenuDefinitionIndex != -1) {
                    if (relation === 'before') {
                        config.items.splice(topLevelMenuDefinitionIndex, 0, itemToAdd.menu);
                        successFullyAddedItems.push(itemToAdd);
                    } else if (relation === 'after') {
                        config.items.splice(topLevelMenuDefinitionIndex + 1, 0, itemToAdd.menu);
                        successFullyAddedItems.push(itemToAdd);
                    }
                } else {
                    const wasAdded = addMenuOrItemToGroup(config, itemToAdd.menu, relativeId, relation);
                    if (wasAdded) {
                        successFullyAddedItems.push(itemToAdd);
                    }
                }
            }
        } else if (isMenuBarMenuGroupAddition(itemToAdd)) {
            walkConfigMenus(config.items, (menuDefinition)=>{
                if (menuDefinition.menuId === relativeId) {
                    // Add a group at the start of a menu.
                    if (relation === 'start') {
                        menuDefinition.groups.unshift(itemToAdd.group);
                        successFullyAddedItems.push(itemToAdd);
                    } else if (relation === 'end') {
                        menuDefinition.groups.push(itemToAdd.group);
                        successFullyAddedItems.push(itemToAdd);
                    }
                } else {
                    const relativeGroupIndex = menuDefinition.groups.findIndex((group)=>group.groupId === relativeId);
                    if (relativeGroupIndex !== -1) {
                        // Add a group before an existing group in a menu.
                        if (relation === 'before') {
                            menuDefinition.groups.splice(relativeGroupIndex, 0, itemToAdd.group);
                            successFullyAddedItems.push(itemToAdd);
                        } else if (relation === 'after') {
                            menuDefinition.groups.splice(relativeGroupIndex + 1, 0, itemToAdd.group);
                            successFullyAddedItems.push(itemToAdd);
                        }
                    }
                }
            });
        } else {
            const wasAdded = addMenuOrItemToGroup(config, itemToAdd.item, relativeId, relation);
            if (wasAdded) {
                successFullyAddedItems.push(itemToAdd);
            }
        }
    }
    for (const addedItemConfig of itemsToBeAdded){
        if (!successFullyAddedItems.includes(addedItemConfig)) {
            /**
			 * There was a problem processing the configuration of the menu bar. The configured item could not be added
			 * because the position it was supposed to be added to does not exist.
			 *
			 * This warning usually shows up when the {@link module:core/plugin~Plugin} which is supposed
			 * to provide a menu bar item has not been loaded or there is a typo in the
			 * {@link module:core/editor/editorconfig~EditorConfig#menuBar menu bar configuration}.
			 *
			 * @error menu-bar-item-could-not-be-removed
			 * @param menuBarConfig The full configuration of the menu bar.
			 * @param itemName The name of the item that was not removed from the menu bar.
			 */ logWarning('menu-bar-item-could-not-be-added', {
                menuBarConfig: originalConfig,
                addedItemConfig
            });
        }
    }
}
/**
 * Handles adding a sub-menu or an item into a group. The logic is the same for both cases.
 */ function addMenuOrItemToGroup(config, itemOrMenuToAdd, relativeId, relation) {
    let wasAdded = false;
    walkConfigMenus(config.items, (menuDefinition)=>{
        for (const { groupId, items: groupItems } of menuDefinition.groups){
            // Avoid infinite loops.
            if (wasAdded) {
                return;
            }
            if (groupId === relativeId) {
                // Adding an item/menu at the beginning of a group.
                if (relation === 'start') {
                    groupItems.unshift(itemOrMenuToAdd);
                    wasAdded = true;
                } else if (relation === 'end') {
                    groupItems.push(itemOrMenuToAdd);
                    wasAdded = true;
                }
            } else {
                // Adding an item/menu relative to an existing item/menu.
                const relativeItemIndex = groupItems.findIndex((groupItem)=>{
                    return getIdFromGroupItem(groupItem) === relativeId;
                });
                if (relativeItemIndex !== -1) {
                    if (relation === 'before') {
                        groupItems.splice(relativeItemIndex, 0, itemOrMenuToAdd);
                        wasAdded = true;
                    } else if (relation === 'after') {
                        groupItems.splice(relativeItemIndex + 1, 0, itemOrMenuToAdd);
                        wasAdded = true;
                    }
                }
            }
        }
    });
    return wasAdded;
}
/**
 * Removes components from the menu bar configuration that are not available in the factory and would
 * not be instantiated. Warns about missing components if the menu bar configuration was specified by the user.
 */ function purgeUnavailableComponents(originalConfig, config, componentFactory) {
    walkConfigMenus(config.items, (menuDefinition)=>{
        for (const groupDefinition of menuDefinition.groups){
            groupDefinition.items = groupDefinition.items.filter((item)=>{
                const isItemUnavailable = typeof item === 'string' && !componentFactory.has(item);
                // The default configuration contains all possible editor features. But integrators' editors rarely load
                // every possible feature. This is why we do not want to log warnings about unavailable items for the default config
                // because they would show up in almost every integration. If the configuration has been provided by
                // the integrator, on the other hand, then these warnings bring value.
                if (isItemUnavailable && !config.isUsingDefaultConfig) {
                    /**
					 * There was a problem processing the configuration of the menu bar. The item with the given
					 * name does not exist so it was omitted when rendering the menu bar.
					 *
					 * This warning usually shows up when the {@link module:core/plugin~Plugin} which is supposed
					 * to provide a menu bar item has not been loaded or there is a typo in the
					 * {@link module:core/editor/editorconfig~EditorConfig#menuBar menu bar configuration}.
					 *
					 * Make sure the plugin responsible for this menu bar item is loaded and the menu bar configuration
					 * is correct, e.g. {@link module:basic-styles/bold/boldui~BoldUI} is loaded for the `'menuBar:bold'`
					 * menu bar item.
					 *
					 * @error menu-bar-item-unavailable
					 * @param menuBarConfig The full configuration of the menu bar.
					 * @param parentMenuConfig The config of the menu the unavailable component was defined in.
					 * @param componentName The name of the unavailable component.
					 */ logWarning('menu-bar-item-unavailable', {
                        menuBarConfig: originalConfig,
                        parentMenuConfig: cloneDeep(menuDefinition),
                        componentName: item
                    });
                }
                return !isItemUnavailable;
            });
        }
    });
}
/**
 * Removes empty menus from the menu bar configuration to improve the visual UX. Such menus can occur
 * when some plugins responsible for providing menu bar items have not been loaded and some part of
 * the configuration populated menus using these components exclusively.
 */ function purgeEmptyMenus(originalConfig, config) {
    const isUsingDefaultConfig = config.isUsingDefaultConfig;
    let wasSubMenuPurged = false;
    // Purge top-level menus.
    config.items = config.items.filter((menuDefinition)=>{
        if (!menuDefinition.groups.length) {
            warnAboutEmptyMenu(originalConfig, menuDefinition, isUsingDefaultConfig);
            return false;
        }
        return true;
    });
    // Warn if there were no top-level menus left in the menu bar after purging.
    if (!config.items.length) {
        warnAboutEmptyMenu(originalConfig, originalConfig, isUsingDefaultConfig);
        return;
    }
    // Purge sub-menus and groups.
    walkConfigMenus(config.items, (menuDefinition)=>{
        // Get rid of empty groups.
        menuDefinition.groups = menuDefinition.groups.filter((groupDefinition)=>{
            if (!groupDefinition.items.length) {
                wasSubMenuPurged = true;
                return false;
            }
            return true;
        });
        // Get rid of empty sub-menus.
        for (const groupDefinition of menuDefinition.groups){
            groupDefinition.items = groupDefinition.items.filter((item)=>{
                // If no groups were left after removing empty ones.
                if (isMenuDefinition(item) && !item.groups.length) {
                    warnAboutEmptyMenu(originalConfig, item, isUsingDefaultConfig);
                    wasSubMenuPurged = true;
                    return false;
                }
                return true;
            });
        }
    });
    if (wasSubMenuPurged) {
        // The config is walked from the root to the leaves so if anything gets removed, we need to re-run the
        // whole process because it could've affected parents.
        purgeEmptyMenus(originalConfig, config);
    }
}
function warnAboutEmptyMenu(originalConfig, emptyMenuConfig, isUsingDefaultConfig) {
    if (isUsingDefaultConfig) {
        return;
    }
    /**
	 * There was a problem processing the configuration of the menu bar. One of the menus
	 * is empty so it was omitted when rendering the menu bar.
	 *
	 * This warning usually shows up when some {@link module:core/plugin~Plugin plugins} responsible for
	 * providing menu bar items have not been loaded and the
	 * {@link module:core/editor/editorconfig~EditorConfig#menuBar menu bar configuration} was not updated.
	 *
	 * Make sure all necessary editor plugins are loaded and/or update the menu bar configuration
	 * to account for the missing menu items.
	 *
	 * @error menu-bar-menu-empty
	 * @param menuBarConfig The full configuration of the menu bar.
	 * @param emptyMenuConfig The definition of the menu that has no child items.
	 */ logWarning('menu-bar-menu-empty', {
        menuBarConfig: originalConfig,
        emptyMenuConfig
    });
}
/**
 * Localizes the user-config using pre-defined localized category labels.
 */ function localizeMenuLabels(config, locale) {
    const t = locale.t;
    const localizedCategoryLabels = {
        // Top-level categories.
        'File': t({
            string: 'File',
            id: 'MENU_BAR_MENU_FILE'
        }),
        'Edit': t({
            string: 'Edit',
            id: 'MENU_BAR_MENU_EDIT'
        }),
        'View': t({
            string: 'View',
            id: 'MENU_BAR_MENU_VIEW'
        }),
        'Insert': t({
            string: 'Insert',
            id: 'MENU_BAR_MENU_INSERT'
        }),
        'Format': t({
            string: 'Format',
            id: 'MENU_BAR_MENU_FORMAT'
        }),
        'Tools': t({
            string: 'Tools',
            id: 'MENU_BAR_MENU_TOOLS'
        }),
        'Help': t({
            string: 'Help',
            id: 'MENU_BAR_MENU_HELP'
        }),
        // Sub-menus.
        'Text': t({
            string: 'Text',
            id: 'MENU_BAR_MENU_TEXT'
        }),
        'Font': t({
            string: 'Font',
            id: 'MENU_BAR_MENU_FONT'
        })
    };
    walkConfigMenus(config.items, (definition)=>{
        if (definition.label in localizedCategoryLabels) {
            definition.label = localizedCategoryLabels[definition.label];
        }
    });
}
/**
 * Recursively visits all menu definitions in the config and calls the callback for each of them.
 */ function walkConfigMenus(definition, callback) {
    if (Array.isArray(definition)) {
        for (const topLevelMenuDefinition of definition){
            walk(topLevelMenuDefinition);
        }
    }
    function walk(menuDefinition) {
        callback(menuDefinition);
        for (const groupDefinition of menuDefinition.groups){
            for (const groupItem of groupDefinition.items){
                if (isMenuDefinition(groupItem)) {
                    walk(groupItem);
                }
            }
        }
    }
}
function isMenuBarMenuAddition(definition) {
    return typeof definition === 'object' && 'menu' in definition;
}
function isMenuBarMenuGroupAddition(definition) {
    return typeof definition === 'object' && 'group' in definition;
}
function getRelationFromPosition(position) {
    if (position.startsWith('start')) {
        return 'start';
    } else if (position.startsWith('end')) {
        return 'end';
    } else if (position.startsWith('after')) {
        return 'after';
    } else {
        return 'before';
    }
}
function getRelativeIdFromPosition(position) {
    const match = position.match(/^[^:]+:(.+)/);
    if (match) {
        return match[1];
    }
    return null;
}
function getIdFromGroupItem(item) {
    return typeof item === 'string' ? item : item.menuId;
}
function isMenuDefinition(definition) {
    return typeof definition === 'object' && 'menuId' in definition;
}
/**
 * Initializes menu bar for given editor.
 *
 * @internal
 */ function _initMenuBar(editor, menuBarView) {
    const menuBarViewElement = menuBarView.element;
    editor.ui.focusTracker.add(menuBarViewElement);
    editor.keystrokes.listenTo(menuBarViewElement);
    const normalizedMenuBarConfig = normalizeMenuBarConfig(editor.config.get('menuBar') || {});
    menuBarView.fillFromConfig(normalizedMenuBarConfig, editor.ui.componentFactory);
    editor.keystrokes.set('Esc', (data, cancel)=>{
        if (menuBarViewElement.contains(editor.ui.focusTracker.focusedElement)) {
            editor.editing.view.focus();
            cancel();
        }
    });
    editor.keystrokes.set('Alt+F9', (data, cancel)=>{
        if (!menuBarViewElement.contains(editor.ui.focusTracker.focusedElement)) {
            menuBarView.focus();
            cancel();
        }
    });
}

/**
 * A view representing a {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#panelView} of a menu.
 */ class MenuBarMenuPanelView extends View {
    /**
	 * Collection of the child views in this panel.
	 */ children;
    /**
	 * Creates an instance of the menu panel view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.set('isVisible', false);
        this.set('position', 'se');
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-reset',
                    'ck-menu-bar__menu__panel',
                    bind.to('position', (value)=>`ck-menu-bar__menu__panel_position_${value}`),
                    bind.if('isVisible', 'ck-hidden', (value)=>!value)
                ],
                tabindex: '-1'
            },
            children: this.children,
            on: {
                // Drag and drop in the panel should not break the selection in the editor.
                // https://github.com/ckeditor/ckeditor5-ui/issues/228
                selectstart: bind.to((evt)=>{
                    if (evt.target.tagName.toLocaleLowerCase() === 'input') {
                        return;
                    }
                    evt.preventDefault();
                })
            }
        });
    }
    /**
	 * Focuses the first child of the panel (default) or the last one if the `direction` is `-1`.
	 */ focus(direction = 1) {
        if (this.children.length) {
            if (direction === 1) {
                this.children.first.focus();
            } else {
                this.children.last.focus();
            }
        }
    }
}

/**
 * A menu view for the {@link module:ui/menubar/menubarview~MenuBarView}. Menus are building blocks of the menu bar,
 * they host other sub-menus and menu items (buttons) that users can interact with.
 */ class MenuBarMenuView extends View {
    /**
	 * Button of the menu view.
	 */ buttonView;
    /**
	 * Panel of the menu. It hosts children of the menu.
	 */ panelView;
    /**
	 * Tracks information about the DOM focus in the menu.
	 */ focusTracker;
    /**
	 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}. It manages
	 * keystrokes of the menu.
	 */ keystrokes;
    /**
	 * Creates an instance of the menu view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        const bind = this.bindTemplate;
        this.buttonView = new MenuBarMenuButtonView(locale);
        this.buttonView.delegate('mouseenter').to(this);
        this.buttonView.bind('isOn', 'isEnabled').to(this, 'isOpen', 'isEnabled');
        this.panelView = new MenuBarMenuPanelView(locale);
        this.panelView.bind('isVisible').to(this, 'isOpen');
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this.set('isOpen', false);
        this.set('isEnabled', true);
        this.set('panelPosition', 'w');
        this.set('class', undefined);
        this.set('parentMenuView', null);
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-menu-bar__menu',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', (value)=>!value),
                    bind.if('parentMenuView', 'ck-menu-bar__menu_top-level', (value)=>!value)
                ]
            },
            children: [
                this.buttonView,
                this.panelView
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        this.focusTracker.add(this.buttonView.element);
        this.focusTracker.add(this.panelView.element);
        // Listen for keystrokes coming from within #element.
        this.keystrokes.listenTo(this.element);
        MenuBarMenuBehaviors.closeOnEscKey(this);
        this._repositionPanelOnOpen();
    }
    // For now, this method cannot be called in the render process because the `parentMenuView` may be assigned
    // after the rendering process.
    //
    // TODO: We should reconsider the way we handle this logic.
    /**
	 * Attach all keyboard behaviors for the menu bar view.
	 *
	 * @internal
	 */ _attachBehaviors() {
        // Top-level menus.
        if (!this.parentMenuView) {
            this._propagateArrowKeystrokeEvents();
            MenuBarMenuBehaviors.openAndFocusPanelOnArrowDownKey(this);
            MenuBarMenuBehaviors.toggleOnButtonClick(this);
        } else {
            MenuBarMenuBehaviors.openOnButtonClick(this);
            MenuBarMenuBehaviors.openOnArrowRightKey(this);
            MenuBarMenuBehaviors.closeOnArrowLeftKey(this);
            MenuBarMenuBehaviors.closeOnParentClose(this);
        }
    }
    /**
	 * Fires `arrowright` and `arrowleft` events when the user pressed corresponding arrow keys.
	 */ _propagateArrowKeystrokeEvents() {
        this.keystrokes.set('arrowright', (data, cancel)=>{
            this.fire('arrowright');
            cancel();
        });
        this.keystrokes.set('arrowleft', (data, cancel)=>{
            this.fire('arrowleft');
            cancel();
        });
    }
    /**
	 * Sets the position of the panel when the menu opens. The panel is positioned
	 * so that it optimally uses the available space in the viewport.
	 */ _repositionPanelOnOpen() {
        // Let the menu control the position of the panel. The position must be updated every time the menu is open.
        this.on('change:isOpen', (evt, name, isOpen)=>{
            if (!isOpen) {
                return;
            }
            const optimalPanelPosition = MenuBarMenuView._getOptimalPosition({
                element: this.panelView.element,
                target: this.buttonView.element,
                fitInViewport: true,
                positions: this._panelPositions
            });
            this.panelView.position = optimalPanelPosition ? optimalPanelPosition.name : this._panelPositions[0].name;
        });
    }
    /**
	 * @inheritDoc
	 */ focus() {
        this.buttonView.focus();
    }
    /**
	 * Positioning functions for the {@link #panelView} . They change depending on the role of the menu (top-level vs sub-menu) in
	 * the {@link module:ui/menubar/menubarview~MenuBarView menu bar} and the UI language direction.
	 */ get _panelPositions() {
        const { southEast, southWest, northEast, northWest, westSouth, eastSouth, westNorth, eastNorth } = MenuBarMenuViewPanelPositioningFunctions;
        if (this.locale.uiLanguageDirection === 'ltr') {
            if (this.parentMenuView) {
                return [
                    eastSouth,
                    eastNorth,
                    westSouth,
                    westNorth
                ];
            } else {
                return [
                    southEast,
                    southWest,
                    northEast,
                    northWest
                ];
            }
        } else {
            if (this.parentMenuView) {
                return [
                    westSouth,
                    westNorth,
                    eastSouth,
                    eastNorth
                ];
            } else {
                return [
                    southWest,
                    southEast,
                    northWest,
                    northEast
                ];
            }
        }
    }
    /**
	 * A function used to calculate the optimal position for the dropdown panel.
	 *
	 * Referenced for unit testing purposes.
	 */ static _getOptimalPosition = getOptimalPosition;
}

/**
 * A list of menu bar items, a child of {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#panelView}.
 *
 * Use this class to create a list of items (options, buttons) to be displayed in a menu bar.
 *
 * To populate this list, use {@link module:ui/menubar/menubarmenulistitemview~MenuBarMenuListItemView} instances.
 */ class MenuBarMenuListView extends ListView {
    /**
	 * Creates an instance of the list view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        this.role = 'menu';
    }
}

/**
 * A menu bar list file dialog button view. Buttons like this one execute user actions.
 *
 * This component provides a button that opens the native file selection dialog.
 */ class MenuBarMenuListItemFileDialogButtonView extends FileDialogButtonView {
    /**
	 * Creates an instance of the menu bar list button view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        this.set({
            withText: true,
            withKeystroke: true,
            tooltip: false,
            role: 'menuitem'
        });
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-menu-bar__menu__item__button'
                ]
            }
        });
    }
}

const EVENT_NAME_DELEGATES = [
    'mouseenter',
    'arrowleft',
    'arrowright',
    'change:isOpen'
];
/**
 * The application menu bar component. It brings a set of top-level menus (and sub-menus) that can be used
 * to organize and access a large number of buttons.
 */ class MenuBarView extends View {
    /**
	 * Collection of the child views inside the {@link #element}.
	 */ children;
    /**
	 * A list of {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} instances registered in the menu bar.
	 *
	 * @observable
	 */ menus = [];
    /**
	 * Creates an instance of the menu bar view.
	 *
	 * @param locale The localization services instance.
	 */ constructor(locale){
        super(locale);
        const t = locale.t;
        this.set('isOpen', false);
        this._setupIsOpenUpdater();
        this.children = this.createCollection();
        // @if CK_DEBUG_MENU_BAR // // Logs events in the main event bus of the component.
        // @if CK_DEBUG_MENU_BAR // this.on( 'menu', ( evt, data ) => {
        // @if CK_DEBUG_MENU_BAR // 	console.log( `MenuBarView:${ evt.name }`, evt.path.map( view => view.element ) );
        // @if CK_DEBUG_MENU_BAR // } );
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-menu-bar'
                ],
                'aria-label': t('Editor menu bar'),
                role: 'menubar'
            },
            children: this.children
        });
    }
    /**
	 * A utility that expands a plain menu bar configuration into a structure of menus (also: sub-menus)
	 * and items using a given {@link module:ui/componentfactory~ComponentFactory component factory}.
	 *
	 * See the {@link module:core/editor/editorconfig~EditorConfig#menuBar menu bar} in the editor
	 * configuration reference to learn how to configure the menu bar.
	 */ fillFromConfig(config, componentFactory) {
        const locale = this.locale;
        const processedConfig = processMenuBarConfig({
            normalizedConfig: config,
            locale,
            componentFactory
        });
        const topLevelCategoryMenuViews = processedConfig.items.map((menuDefinition)=>this._createMenu({
                componentFactory,
                menuDefinition
            }));
        this.children.addMany(topLevelCategoryMenuViews);
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        MenuBarBehaviors.toggleMenusAndFocusItemsOnHover(this);
        MenuBarBehaviors.closeMenusWhenTheBarCloses(this);
        MenuBarBehaviors.closeMenuWhenAnotherOnTheSameLevelOpens(this);
        MenuBarBehaviors.focusCycleMenusOnArrows(this);
        MenuBarBehaviors.closeOnClickOutside(this);
    }
    /**
	 * Focuses the menu bar.
	 */ focus() {
        if (this.children.first) {
            this.children.first.focus();
        }
    }
    /**
	 * Closes all menus in the bar.
	 */ close() {
        for (const topLevelCategoryMenuView of this.children){
            topLevelCategoryMenuView.isOpen = false;
        }
    }
    /**
	 * Registers a menu view in the menu bar. Every {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} instance must be registered
	 * in the menu bar to be properly managed.
	 */ registerMenu(menuView, parentMenuView = null) {
        if (parentMenuView) {
            menuView.delegate(...EVENT_NAME_DELEGATES).to(parentMenuView);
            menuView.parentMenuView = parentMenuView;
        } else {
            menuView.delegate(...EVENT_NAME_DELEGATES).to(this, (name)=>'menu:' + name);
        }
        menuView._attachBehaviors();
        this.menus.push(menuView);
    }
    /**
	 * Creates a {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} based on the given definition.
	 */ _createMenu({ componentFactory, menuDefinition, parentMenuView }) {
        const locale = this.locale;
        const menuView = new MenuBarMenuView(locale);
        this.registerMenu(menuView, parentMenuView);
        menuView.buttonView.set({
            label: menuDefinition.label
        });
        // Defer the creation of the menu structure until it gets open. This is a performance optimization
        // that shortens the time needed to create the editor.
        menuView.once('change:isOpen', ()=>{
            const listView = new MenuBarMenuListView(locale);
            listView.ariaLabel = menuDefinition.label;
            menuView.panelView.children.add(listView);
            listView.items.addMany(this._createMenuItems({
                menuDefinition,
                parentMenuView: menuView,
                componentFactory
            }));
        });
        return menuView;
    }
    /**
	 * Creates a {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} items based on the given definition.
	 */ _createMenuItems({ menuDefinition, parentMenuView, componentFactory }) {
        const locale = this.locale;
        const items = [];
        for (const menuGroupDefinition of menuDefinition.groups){
            for (const itemDefinition of menuGroupDefinition.items){
                const menuItemView = new MenuBarMenuListItemView(locale, parentMenuView);
                if (isObject(itemDefinition)) {
                    menuItemView.children.add(this._createMenu({
                        componentFactory,
                        menuDefinition: itemDefinition,
                        parentMenuView
                    }));
                } else {
                    const componentView = this._createMenuItemContentFromFactory({
                        componentName: itemDefinition,
                        componentFactory,
                        parentMenuView
                    });
                    if (!componentView) {
                        continue;
                    }
                    menuItemView.children.add(componentView);
                }
                items.push(menuItemView);
            }
            // Separate groups with a separator.
            if (menuGroupDefinition !== menuDefinition.groups[menuDefinition.groups.length - 1]) {
                items.push(new ListSeparatorView(locale));
            }
        }
        return items;
    }
    /**
	 * Uses the component factory to create a content of the menu item (a button or a sub-menu).
	 */ _createMenuItemContentFromFactory({ componentName, parentMenuView, componentFactory }) {
        const componentView = componentFactory.create(componentName);
        if (!(componentView instanceof MenuBarMenuView || componentView instanceof MenuBarMenuListItemButtonView || componentView instanceof MenuBarMenuListItemFileDialogButtonView)) {
            /**
			 * Adding unsupported components to the {@link module:ui/menubar/menubarview~MenuBarView} is not possible.
			 *
			 * A component should be either a {@link module:ui/menubar/menubarmenuview~MenuBarMenuView} (sub-menu) or a
			 * {@link module:ui/menubar/menubarmenulistitembuttonview~MenuBarMenuListItemButtonView} (button).
			 *
			 * @error menu-bar-component-unsupported
			 * @param componentName A name of the unsupported component used in the configuration.
			 * @param componentView An unsupported component view.
			 */ logWarning('menu-bar-component-unsupported', {
                componentName,
                componentView
            });
            return null;
        }
        this._registerMenuTree(componentView, parentMenuView);
        // Close the whole menu bar when a component is executed.
        componentView.on('execute', ()=>{
            this.close();
        });
        return componentView;
    }
    /**
	 * Checks component and its children recursively and calls {@link #registerMenu}
	 * for each item that is {@link module:ui/menubar/menubarmenuview~MenuBarMenuView}.
	 *
	 * @internal
	 */ _registerMenuTree(componentView, parentMenuView) {
        if (!(componentView instanceof MenuBarMenuView)) {
            componentView.delegate('mouseenter').to(parentMenuView);
            return;
        }
        this.registerMenu(componentView, parentMenuView);
        const menuBarItemsList = componentView.panelView.children.filter((child)=>child instanceof MenuBarMenuListView)[0];
        if (!menuBarItemsList) {
            componentView.delegate('mouseenter').to(parentMenuView);
            return;
        }
        const nonSeparatorItems = menuBarItemsList.items.filter((item)=>item instanceof ListItemView);
        for (const item of nonSeparatorItems){
            this._registerMenuTree(item.children.get(0), componentView);
        }
    }
    /**
	 * Manages the state of the {@link #isOpen} property of the menu bar. Because the state is a sum of individual
	 * top-level menus' states, it's necessary to listen to their changes and update the state accordingly.
	 *
	 * Additionally, it prevents from unnecessary changes of `isOpen` when one top-level menu opens and another closes
	 * (regardless of in which order), maintaining a stable `isOpen === true` in that situation.
	 */ _setupIsOpenUpdater() {
        let closeTimeout;
        // TODO: This is not the prettiest approach but at least it's simple.
        this.on('menu:change:isOpen', (evt, name, isOpen)=>{
            clearTimeout(closeTimeout);
            if (isOpen) {
                this.isOpen = true;
            } else {
                closeTimeout = setTimeout(()=>{
                    this.isOpen = Array.from(this.children).some((menuView)=>menuView.isOpen);
                }, 0);
            }
        });
    }
}

export { AccessibilityHelp, AutocompleteView, BalloonPanelView, BalloonToolbar, BlockToolbar, BodyCollection, BoxedEditorUIView, ButtonLabelView, ButtonView, CollapsibleView, ColorGridView, ColorPickerView, ColorSelectorView, ColorTileView, ComponentFactory, ContextualBalloon, CssTransitionDisablerMixin, DefaultMenuBarItems, Dialog, DialogView, DialogViewPosition, DropdownButtonView, DropdownPanelView, DropdownView, EditorUI, EditorUIView, FileDialogButtonView, FocusCycler, FormHeaderView, HighlightedTextView, IconView, IframeView, InlineEditableUIView, InputNumberView, InputTextView, InputView, LabelView, LabeledFieldView, ListItemGroupView, ListItemView, ListSeparatorView, ListView, MenuBarMenuListItemButtonView, MenuBarMenuListItemFileDialogButtonView, MenuBarMenuListItemView, MenuBarMenuListView, MenuBarMenuView, MenuBarView, Notification, SearchInfoView, SearchTextView, SpinnerView, SplitButtonView, StickyPanelView, SwitchButtonView, Template, TextareaView, ToolbarLineBreakView, ToolbarSeparatorView, ToolbarView, TooltipManager, View, ViewCollection, Model as ViewModel, _initMenuBar, addKeyboardHandlingForGrid, addListToDropdown, addToolbarToDropdown, clickOutsideHandler, createDropdown, createLabeledDropdown, createLabeledInputNumber, createLabeledInputText, createLabeledTextarea, focusChildOnDropdownOpen, getLocalizedColorOptions, injectCssTransitionDisabler, isFocusable, isViewWithFocusCycler, normalizeColorOptions, normalizeMenuBarConfig, normalizeSingleColorDefinition, normalizeToolbarConfig, submitHandler };
//# sourceMappingURL=index.js.map
