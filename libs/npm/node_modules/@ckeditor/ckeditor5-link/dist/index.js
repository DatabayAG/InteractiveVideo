/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin, icons } from '@ckeditor/ckeditor5-core/dist/index.js';
import { findAttributeRange, TwoStepCaretMovement, Input, inlineHighlight, Delete, TextWatcher, getLastTextLine } from '@ckeditor/ckeditor5-typing/dist/index.js';
import { ClipboardPipeline } from '@ckeditor/ckeditor5-clipboard/dist/index.js';
import { toMap, Collection, first, ObservableMixin, env, keyCodes, FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils/dist/index.js';
import { upperFirst } from 'lodash-es';
import { ClickObserver, Matcher } from '@ckeditor/ckeditor5-engine/dist/index.js';
import { View, ViewCollection, FocusCycler, submitHandler, LabeledFieldView, createLabeledInputText, ButtonView, SwitchButtonView, ContextualBalloon, CssTransitionDisablerMixin, MenuBarMenuListItemButtonView, clickOutsideHandler } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { isWidget } from '@ckeditor/ckeditor5-widget/dist/index.js';

/**
 * Helper class that ties together all {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition} and provides
 * the {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement downcast dispatchers} for them.
 */ class AutomaticDecorators {
    /**
	 * Stores the definition of {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators}.
	 * This data is used as a source for a downcast dispatcher to create a proper conversion to output data.
	 */ _definitions = new Set();
    /**
	 * Gives information about the number of decorators stored in the {@link module:link/utils/automaticdecorators~AutomaticDecorators}
	 * instance.
	 */ get length() {
        return this._definitions.size;
    }
    /**
	 * Adds automatic decorator objects or an array with them to be used during downcasting.
	 *
	 * @param item A configuration object of automatic rules for decorating links. It might also be an array of such objects.
	 */ add(item) {
        if (Array.isArray(item)) {
            item.forEach((item)=>this._definitions.add(item));
        } else {
            this._definitions.add(item);
        }
    }
    /**
	 * Provides the conversion helper used in the {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add} method.
	 *
	 * @returns A dispatcher function used as conversion helper in {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add}.
	 */ getDispatcher() {
        return (dispatcher)=>{
            dispatcher.on('attribute:linkHref', (evt, data, conversionApi)=>{
                // There is only test as this behavior decorates links and
                // it is run before dispatcher which actually consumes this node.
                // This allows on writing own dispatcher with highest priority,
                // which blocks both native converter and this additional decoration.
                if (!conversionApi.consumable.test(data.item, 'attribute:linkHref')) {
                    return;
                }
                // Automatic decorators for block links are handled e.g. in LinkImageEditing.
                if (!(data.item.is('selection') || conversionApi.schema.isInline(data.item))) {
                    return;
                }
                const viewWriter = conversionApi.writer;
                const viewSelection = viewWriter.document.selection;
                for (const item of this._definitions){
                    const viewElement = viewWriter.createAttributeElement('a', item.attributes, {
                        priority: 5
                    });
                    if (item.classes) {
                        viewWriter.addClass(item.classes, viewElement);
                    }
                    for(const key in item.styles){
                        viewWriter.setStyle(key, item.styles[key], viewElement);
                    }
                    viewWriter.setCustomProperty('link', true, viewElement);
                    if (item.callback(data.attributeNewValue)) {
                        if (data.item.is('selection')) {
                            viewWriter.wrap(viewSelection.getFirstRange(), viewElement);
                        } else {
                            viewWriter.wrap(conversionApi.mapper.toViewRange(data.range), viewElement);
                        }
                    } else {
                        viewWriter.unwrap(conversionApi.mapper.toViewRange(data.range), viewElement);
                    }
                }
            }, {
                priority: 'high'
            });
        };
    }
    /**
	 * Provides the conversion helper used in the {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add} method
	 * when linking images.
	 *
	 * @returns A dispatcher function used as conversion helper in {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add}.
	 */ getDispatcherForLinkedImage() {
        return (dispatcher)=>{
            dispatcher.on('attribute:linkHref:imageBlock', (evt, data, { writer, mapper })=>{
                const viewFigure = mapper.toViewElement(data.item);
                const linkInImage = Array.from(viewFigure.getChildren()).find((child)=>child.is('element', 'a'));
                for (const item of this._definitions){
                    const attributes = toMap(item.attributes);
                    if (item.callback(data.attributeNewValue)) {
                        for (const [key, val] of attributes){
                            // Left for backward compatibility. Since v30 decorator should
                            // accept `classes` and `styles` separately from `attributes`.
                            if (key === 'class') {
                                writer.addClass(val, linkInImage);
                            } else {
                                writer.setAttribute(key, val, linkInImage);
                            }
                        }
                        if (item.classes) {
                            writer.addClass(item.classes, linkInImage);
                        }
                        for(const key in item.styles){
                            writer.setStyle(key, item.styles[key], linkInImage);
                        }
                    } else {
                        for (const [key, val] of attributes){
                            if (key === 'class') {
                                writer.removeClass(val, linkInImage);
                            } else {
                                writer.removeAttribute(key, linkInImage);
                            }
                        }
                        if (item.classes) {
                            writer.removeClass(item.classes, linkInImage);
                        }
                        for(const key in item.styles){
                            writer.removeStyle(key, linkInImage);
                        }
                    }
                }
            });
        };
    }
}

const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex
const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';
// Simplified email test - should be run over previously found URL.
const EMAIL_REG_EXP = /^[\S]+@((?![-_])(?:[-\w\u00a1-\uffff]{0,63}[^-_]\.))+(?:[a-z\u00a1-\uffff]{2,})$/i;
// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the link ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;
const DEFAULT_LINK_PROTOCOLS = [
    'https?',
    'ftps?',
    'mailto'
];
/**
 * A keystroke used by the {@link module:link/linkui~LinkUI link UI feature}.
 */ const LINK_KEYSTROKE = 'Ctrl+K';
/**
 * Returns `true` if a given view node is the link element.
 */ function isLinkElement(node) {
    return node.is('attributeElement') && !!node.getCustomProperty('link');
}
/**
 * Creates a link {@link module:engine/view/attributeelement~AttributeElement} with the provided `href` attribute.
 */ function createLinkElement(href, { writer }) {
    // Priority 5 - https://github.com/ckeditor/ckeditor5-link/issues/121.
    const linkElement = writer.createAttributeElement('a', {
        href
    }, {
        priority: 5
    });
    writer.setCustomProperty('link', true, linkElement);
    return linkElement;
}
/**
 * Returns a safe URL based on a given value.
 *
 * A URL is considered safe if it is safe for the user (does not contain any malicious code).
 *
 * If a URL is considered unsafe, a simple `"#"` is returned.
 *
 * @internal
 */ function ensureSafeUrl(url, allowedProtocols = DEFAULT_LINK_PROTOCOLS) {
    const urlString = String(url);
    const protocolsList = allowedProtocols.join('|');
    const customSafeRegex = new RegExp(`${SAFE_URL_TEMPLATE.replace('<protocols>', protocolsList)}`, 'i');
    return isSafeUrl(urlString, customSafeRegex) ? urlString : '#';
}
/**
 * Checks whether the given URL is safe for the user (does not contain any malicious code).
 */ function isSafeUrl(url, customRegexp) {
    const normalizedUrl = url.replace(ATTRIBUTE_WHITESPACES, '');
    return !!normalizedUrl.match(customRegexp);
}
/**
 * Returns the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration processed
 * to respect the locale of the editor, i.e. to display the {@link module:link/linkconfig~LinkDecoratorManualDefinition label}
 * in the correct language.
 *
 * **Note**: Only the few most commonly used labels are translated automatically. Other labels should be manually
 * translated in the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration.
 *
 * @param t Shorthand for {@link module:utils/locale~Locale#t Locale#t}.
 * @param decorators The decorator reference where the label values should be localized.
 */ function getLocalizedDecorators(t, decorators) {
    const localizedDecoratorsLabels = {
        'Open in a new tab': t('Open in a new tab'),
        'Downloadable': t('Downloadable')
    };
    decorators.forEach((decorator)=>{
        if ('label' in decorator && localizedDecoratorsLabels[decorator.label]) {
            decorator.label = localizedDecoratorsLabels[decorator.label];
        }
        return decorator;
    });
    return decorators;
}
/**
 * Converts an object with defined decorators to a normalized array of decorators. The `id` key is added for each decorator and
 * is used as the attribute's name in the model.
 */ function normalizeDecorators(decorators) {
    const retArray = [];
    if (decorators) {
        for (const [key, value] of Object.entries(decorators)){
            const decorator = Object.assign({}, value, {
                id: `link${upperFirst(key)}`
            });
            retArray.push(decorator);
        }
    }
    return retArray;
}
/**
 * Returns `true` if the specified `element` can be linked (the element allows the `linkHref` attribute).
 */ function isLinkableElement(element, schema) {
    if (!element) {
        return false;
    }
    return schema.checkAttribute(element.name, 'linkHref');
}
/**
 * Returns `true` if the specified `value` is an email.
 */ function isEmail(value) {
    return EMAIL_REG_EXP.test(value);
}
/**
 * Adds the protocol prefix to the specified `link` when:
 *
 * * it does not contain it already, and there is a {@link module:link/linkconfig~LinkConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided,
 * * or the link is an email address.
 */ function addLinkProtocolIfApplicable(link, defaultProtocol) {
    const protocol = isEmail(link) ? 'mailto:' : defaultProtocol;
    const isProtocolNeeded = !!protocol && !linkHasProtocol(link);
    return link && isProtocolNeeded ? protocol + link : link;
}
/**
 * Checks if protocol is already included in the link.
 */ function linkHasProtocol(link) {
    return PROTOCOL_REG_EXP.test(link);
}
/**
 * Opens the link in a new browser tab.
 */ function openLink(link) {
    window.open(link, '_blank', 'noopener');
}

/**
 * The link command. It is used by the {@link module:link/link~Link link feature}.
 */ class LinkCommand extends Command {
    /**
	 * A collection of {@link module:link/utils/manualdecorator~ManualDecorator manual decorators}
	 * corresponding to the {@link module:link/linkconfig~LinkConfig#decorators decorator configuration}.
	 *
	 * You can consider it a model with states of manual decorators added to the currently selected link.
	 */ manualDecorators = new Collection();
    /**
	 * An instance of the helper that ties together all {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition}
	 * that are used by the {@glink features/link link} and the {@glink features/images/images-linking linking images} features.
	 */ automaticDecorators = new AutomaticDecorators();
    /**
	 * Synchronizes the state of {@link #manualDecorators} with the currently present elements in the model.
	 */ restoreManualDecoratorStates() {
        for (const manualDecorator of this.manualDecorators){
            manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
        }
    }
    /**
	 * @inheritDoc
	 */ refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const selectedElement = selection.getSelectedElement() || first(selection.getSelectedBlocks());
        // A check for any integration that allows linking elements (e.g. `LinkImage`).
        // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
        if (isLinkableElement(selectedElement, model.schema)) {
            this.value = selectedElement.getAttribute('linkHref');
            this.isEnabled = model.schema.checkAttribute(selectedElement, 'linkHref');
        } else {
            this.value = selection.getAttribute('linkHref');
            this.isEnabled = model.schema.checkAttributeInSelection(selection, 'linkHref');
        }
        for (const manualDecorator of this.manualDecorators){
            manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
        }
    }
    /**
	 * Executes the command.
	 *
	 * When the selection is non-collapsed, the `linkHref` attribute will be applied to nodes inside the selection, but only to
	 * those nodes where the `linkHref` attribute is allowed (disallowed nodes will be omitted).
	 *
	 * When the selection is collapsed and is not inside the text with the `linkHref` attribute, a
	 * new {@link module:engine/model/text~Text text node} with the `linkHref` attribute will be inserted in place of the caret, but
	 * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
	 * The selection will be updated to wrap the just inserted text node.
	 *
	 * When the selection is collapsed and inside the text with the `linkHref` attribute, the attribute value will be updated.
	 *
	 * # Decorators and model attribute management
	 *
	 * There is an optional argument to this command that applies or removes model
	 * {@glink framework/architecture/editing-engine#text-attributes text attributes} brought by
	 * {@link module:link/utils/manualdecorator~ManualDecorator manual link decorators}.
	 *
	 * Text attribute names in the model correspond to the entries in the {@link module:link/linkconfig~LinkConfig#decorators
	 * configuration}.
	 * For every decorator configured, a model text attribute exists with the "link" prefix. For example, a `'linkMyDecorator'` attribute
	 * corresponds to `'myDecorator'` in the configuration.
	 *
	 * To learn more about link decorators, check out the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`}
	 * documentation.
	 *
	 * Here is how to manage decorator attributes with the link command:
	 *
	 * ```ts
	 * const linkCommand = editor.commands.get( 'link' );
	 *
	 * // Adding a new decorator attribute.
	 * linkCommand.execute( 'http://example.com', {
	 * 	linkIsExternal: true
	 * } );
	 *
	 * // Removing a decorator attribute from the selection.
	 * linkCommand.execute( 'http://example.com', {
	 * 	linkIsExternal: false
	 * } );
	 *
	 * // Adding multiple decorator attributes at the same time.
	 * linkCommand.execute( 'http://example.com', {
	 * 	linkIsExternal: true,
	 * 	linkIsDownloadable: true,
	 * } );
	 *
	 * // Removing and adding decorator attributes at the same time.
	 * linkCommand.execute( 'http://example.com', {
	 * 	linkIsExternal: false,
	 * 	linkFoo: true,
	 * 	linkIsDownloadable: false,
	 * } );
	 * ```
	 *
	 * **Note**: If the decorator attribute name is not specified, its state remains untouched.
	 *
	 * **Note**: {@link module:link/unlinkcommand~UnlinkCommand#execute `UnlinkCommand#execute()`} removes all
	 * decorator attributes.
	 *
	 * @fires execute
	 * @param href Link destination.
	 * @param manualDecoratorIds The information about manual decorator attributes to be applied or removed upon execution.
	 */ execute(href, manualDecoratorIds = {}) {
        const model = this.editor.model;
        const selection = model.document.selection;
        // Stores information about manual decorators to turn them on/off when command is applied.
        const truthyManualDecorators = [];
        const falsyManualDecorators = [];
        for(const name in manualDecoratorIds){
            if (manualDecoratorIds[name]) {
                truthyManualDecorators.push(name);
            } else {
                falsyManualDecorators.push(name);
            }
        }
        model.change((writer)=>{
            // If selection is collapsed then update selected link or insert new one at the place of caret.
            if (selection.isCollapsed) {
                const position = selection.getFirstPosition();
                // When selection is inside text with `linkHref` attribute.
                if (selection.hasAttribute('linkHref')) {
                    const linkText = extractTextFromSelection(selection);
                    // Then update `linkHref` value.
                    let linkRange = findAttributeRange(position, 'linkHref', selection.getAttribute('linkHref'), model);
                    if (selection.getAttribute('linkHref') === linkText) {
                        linkRange = this._updateLinkContent(model, writer, linkRange, href);
                    }
                    writer.setAttribute('linkHref', href, linkRange);
                    truthyManualDecorators.forEach((item)=>{
                        writer.setAttribute(item, true, linkRange);
                    });
                    falsyManualDecorators.forEach((item)=>{
                        writer.removeAttribute(item, linkRange);
                    });
                    // Put the selection at the end of the updated link.
                    writer.setSelection(writer.createPositionAfter(linkRange.end.nodeBefore));
                } else if (href !== '') {
                    const attributes = toMap(selection.getAttributes());
                    attributes.set('linkHref', href);
                    truthyManualDecorators.forEach((item)=>{
                        attributes.set(item, true);
                    });
                    const { end: positionAfter } = model.insertContent(writer.createText(href, attributes), position);
                    // Put the selection at the end of the inserted link.
                    // Using end of range returned from insertContent in case nodes with the same attributes got merged.
                    writer.setSelection(positionAfter);
                }
                // Remove the `linkHref` attribute and all link decorators from the selection.
                // It stops adding a new content into the link element.
                [
                    'linkHref',
                    ...truthyManualDecorators,
                    ...falsyManualDecorators
                ].forEach((item)=>{
                    writer.removeSelectionAttribute(item);
                });
            } else {
                // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
                // omitting nodes where the `linkHref` attribute is disallowed.
                const ranges = model.schema.getValidRanges(selection.getRanges(), 'linkHref');
                // But for the first, check whether the `linkHref` attribute is allowed on selected blocks (e.g. the "image" element).
                const allowedRanges = [];
                for (const element of selection.getSelectedBlocks()){
                    if (model.schema.checkAttribute(element, 'linkHref')) {
                        allowedRanges.push(writer.createRangeOn(element));
                    }
                }
                // Ranges that accept the `linkHref` attribute. Since we will iterate over `allowedRanges`, let's clone it.
                const rangesToUpdate = allowedRanges.slice();
                // For all selection ranges we want to check whether given range is inside an element that accepts the `linkHref` attribute.
                // If so, we don't want to propagate applying the attribute to its children.
                for (const range of ranges){
                    if (this._isRangeToUpdate(range, allowedRanges)) {
                        rangesToUpdate.push(range);
                    }
                }
                for (const range of rangesToUpdate){
                    let linkRange = range;
                    if (rangesToUpdate.length === 1) {
                        // Current text of the link in the document.
                        const linkText = extractTextFromSelection(selection);
                        if (selection.getAttribute('linkHref') === linkText) {
                            linkRange = this._updateLinkContent(model, writer, range, href);
                            writer.setSelection(writer.createSelection(linkRange));
                        }
                    }
                    writer.setAttribute('linkHref', href, linkRange);
                    truthyManualDecorators.forEach((item)=>{
                        writer.setAttribute(item, true, linkRange);
                    });
                    falsyManualDecorators.forEach((item)=>{
                        writer.removeAttribute(item, linkRange);
                    });
                }
            }
        });
    }
    /**
	 * Provides information whether a decorator with a given name is present in the currently processed selection.
	 *
	 * @param decoratorName The name of the manual decorator used in the model
	 * @returns The information whether a given decorator is currently present in the selection.
	 */ _getDecoratorStateFromModel(decoratorName) {
        const model = this.editor.model;
        const selection = model.document.selection;
        const selectedElement = selection.getSelectedElement();
        // A check for the `LinkImage` plugin. If the selection contains an element, get values from the element.
        // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
        if (isLinkableElement(selectedElement, model.schema)) {
            return selectedElement.getAttribute(decoratorName);
        }
        return selection.getAttribute(decoratorName);
    }
    /**
	 * Checks whether specified `range` is inside an element that accepts the `linkHref` attribute.
	 *
	 * @param range A range to check.
	 * @param allowedRanges An array of ranges created on elements where the attribute is accepted.
	 */ _isRangeToUpdate(range, allowedRanges) {
        for (const allowedRange of allowedRanges){
            // A range is inside an element that will have the `linkHref` attribute. Do not modify its nodes.
            if (allowedRange.containsRange(range)) {
                return false;
            }
        }
        return true;
    }
    /**
	 * Updates selected link with a new value as its content and as its href attribute.
	 *
	 * @param model Model is need to insert content.
	 * @param writer Writer is need to create text element in model.
	 * @param range A range where should be inserted content.
	 * @param href A link value which should be in the href attribute and in the content.
	 */ _updateLinkContent(model, writer, range, href) {
        const text = writer.createText(href, {
            linkHref: href
        });
        return model.insertContent(text, range);
    }
}
// Returns a text of a link under the collapsed selection or a selection that contains the entire link.
function extractTextFromSelection(selection) {
    if (selection.isCollapsed) {
        const firstPosition = selection.getFirstPosition();
        return firstPosition.textNode && firstPosition.textNode.data;
    } else {
        const rangeItems = Array.from(selection.getFirstRange().getItems());
        if (rangeItems.length > 1) {
            return null;
        }
        const firstNode = rangeItems[0];
        if (firstNode.is('$text') || firstNode.is('$textProxy')) {
            return firstNode.data;
        }
        return null;
    }
}

/**
 * The unlink command. It is used by the {@link module:link/link~Link link plugin}.
 */ class UnlinkCommand extends Command {
    /**
	 * @inheritDoc
	 */ refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const selectedElement = selection.getSelectedElement();
        // A check for any integration that allows linking elements (e.g. `LinkImage`).
        // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
        if (isLinkableElement(selectedElement, model.schema)) {
            this.isEnabled = model.schema.checkAttribute(selectedElement, 'linkHref');
        } else {
            this.isEnabled = model.schema.checkAttributeInSelection(selection, 'linkHref');
        }
    }
    /**
	 * Executes the command.
	 *
	 * When the selection is collapsed, it removes the `linkHref` attribute from each node with the same `linkHref` attribute value.
	 * When the selection is non-collapsed, it removes the `linkHref` attribute from each node in selected ranges.
	 *
	 * # Decorators
	 *
	 * If {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} is specified,
	 * all configured decorators are removed together with the `linkHref` attribute.
	 *
	 * @fires execute
	 */ execute() {
        const editor = this.editor;
        const model = this.editor.model;
        const selection = model.document.selection;
        const linkCommand = editor.commands.get('link');
        model.change((writer)=>{
            // Get ranges to unlink.
            const rangesToUnlink = selection.isCollapsed ? [
                findAttributeRange(selection.getFirstPosition(), 'linkHref', selection.getAttribute('linkHref'), model)
            ] : model.schema.getValidRanges(selection.getRanges(), 'linkHref');
            // Remove `linkHref` attribute from specified ranges.
            for (const range of rangesToUnlink){
                writer.removeAttribute('linkHref', range);
                // If there are registered custom attributes, then remove them during unlink.
                if (linkCommand) {
                    for (const manualDecorator of linkCommand.manualDecorators){
                        writer.removeAttribute(manualDecorator.id, range);
                    }
                }
            }
        });
    }
}

/**
 * Helper class that stores manual decorators with observable {@link module:link/utils/manualdecorator~ManualDecorator#value}
 * to support integration with the UI state. An instance of this class is a model with the state of individual manual decorators.
 * These decorators are kept as collections in {@link module:link/linkcommand~LinkCommand#manualDecorators}.
 */ class ManualDecorator extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * An ID of a manual decorator which is the name of the attribute in the model, for example: 'linkManualDecorator0'.
	 */ id;
    /**
	 * The default value of manual decorator.
	 */ defaultValue;
    /**
	 * The label used in the user interface to toggle the manual decorator.
	 */ label;
    /**
	 * A set of attributes added to downcasted data when the decorator is activated for a specific link.
	 * Attributes should be added in a form of attributes defined in {@link module:engine/view/elementdefinition~ElementDefinition}.
	 */ attributes;
    /**
	 * A set of classes added to downcasted data when the decorator is activated for a specific link.
	 * Classes should be added in a form of classes defined in {@link module:engine/view/elementdefinition~ElementDefinition}.
	 */ classes;
    /**
	 * A set of styles added to downcasted data when the decorator is activated for a specific link.
	 * Styles should be added in a form of styles defined in {@link module:engine/view/elementdefinition~ElementDefinition}.
	 */ styles;
    /**
	 * Creates a new instance of {@link module:link/utils/manualdecorator~ManualDecorator}.
	 *
	 * @param config.id The name of the attribute used in the model that represents a given manual decorator.
	 * For example: `'linkIsExternal'`.
	 * @param config.label The label used in the user interface to toggle the manual decorator.
	 * @param config.attributes A set of attributes added to output data when the decorator is active for a specific link.
	 * Attributes should keep the format of attributes defined in {@link module:engine/view/elementdefinition~ElementDefinition}.
	 * @param [config.defaultValue] Controls whether the decorator is "on" by default.
	 */ constructor({ id, label, attributes, classes, styles, defaultValue }){
        super();
        this.id = id;
        this.set('value', undefined);
        this.defaultValue = defaultValue;
        this.label = label;
        this.attributes = attributes;
        this.classes = classes;
        this.styles = styles;
    }
    /**
	 * Returns {@link module:engine/view/matcher~MatcherPattern} with decorator attributes.
	 *
	 * @internal
	 */ _createPattern() {
        return {
            attributes: this.attributes,
            classes: this.classes,
            styles: this.styles
        };
    }
}

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;
/**
 * The link engine feature.
 *
 * It introduces the `linkHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'link'` and `'unlink'` commands.
 */ class LinkEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'LinkEditing';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        // Clipboard is required for handling cut and paste events while typing over the link.
        return [
            TwoStepCaretMovement,
            Input,
            ClipboardPipeline
        ];
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        editor.config.define('link', {
            allowCreatingEmptyLinks: false,
            addTargetToExternalLinks: false
        });
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const allowedProtocols = this.editor.config.get('link.allowedProtocols');
        // Allow link attribute on all inline nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: 'linkHref'
        });
        editor.conversion.for('dataDowncast').attributeToElement({
            model: 'linkHref',
            view: createLinkElement
        });
        editor.conversion.for('editingDowncast').attributeToElement({
            model: 'linkHref',
            view: (href, conversionApi)=>{
                return createLinkElement(ensureSafeUrl(href, allowedProtocols), conversionApi);
            }
        });
        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    href: true
                }
            },
            model: {
                key: 'linkHref',
                value: (viewElement)=>viewElement.getAttribute('href')
            }
        });
        // Create linking commands.
        editor.commands.add('link', new LinkCommand(editor));
        editor.commands.add('unlink', new UnlinkCommand(editor));
        const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(editor.config.get('link.decorators')));
        this._enableAutomaticDecorators(linkDecorators.filter((item)=>item.mode === DECORATOR_AUTOMATIC));
        this._enableManualDecorators(linkDecorators.filter((item)=>item.mode === DECORATOR_MANUAL));
        // Enable two-step caret movement for `linkHref` attribute.
        const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
        twoStepCaretMovementPlugin.registerAttribute('linkHref');
        // Setup highlight over selected link.
        inlineHighlight(editor, 'linkHref', 'a', HIGHLIGHT_CLASS);
        // Handle link following by CTRL+click or ALT+ENTER
        this._enableLinkOpen();
        // Clears the DocumentSelection decorator attributes if the selection is no longer in a link (for example while using 2-SCM).
        this._enableSelectionAttributesFixer();
        // Handle adding default protocol to pasted links.
        this._enableClipboardIntegration();
    }
    /**
	 * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators}
	 * and registers a {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher downcast dispatcher}
	 * for each one of them. Downcast dispatchers are obtained using the
	 * {@link module:link/utils/automaticdecorators~AutomaticDecorators#getDispatcher} method.
	 *
	 * **Note**: This method also activates the automatic external link decorator if enabled with
	 * {@link module:link/linkconfig~LinkConfig#addTargetToExternalLinks `config.link.addTargetToExternalLinks`}.
	 */ _enableAutomaticDecorators(automaticDecoratorDefinitions) {
        const editor = this.editor;
        // Store automatic decorators in the command instance as we do the same with manual decorators.
        // Thanks to that, `LinkImageEditing` plugin can re-use the same definitions.
        const command = editor.commands.get('link');
        const automaticDecorators = command.automaticDecorators;
        // Adds a default decorator for external links.
        if (editor.config.get('link.addTargetToExternalLinks')) {
            automaticDecorators.add({
                id: 'linkIsExternal',
                mode: DECORATOR_AUTOMATIC,
                callback: (url)=>!!url && EXTERNAL_LINKS_REGEXP.test(url),
                attributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            });
        }
        automaticDecorators.add(automaticDecoratorDefinitions);
        if (automaticDecorators.length) {
            editor.conversion.for('downcast').add(automaticDecorators.getDispatcher());
        }
    }
    /**
	 * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorManualDefinition manual decorators},
	 * transforms them into {@link module:link/utils/manualdecorator~ManualDecorator} instances and stores them in the
	 * {@link module:link/linkcommand~LinkCommand#manualDecorators} collection (a model for manual decorators state).
	 *
	 * Also registers an {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement attribute-to-element}
	 * converter for each manual decorator and extends the {@link module:engine/model/schema~Schema model's schema}
	 * with adequate model attributes.
	 */ _enableManualDecorators(manualDecoratorDefinitions) {
        if (!manualDecoratorDefinitions.length) {
            return;
        }
        const editor = this.editor;
        const command = editor.commands.get('link');
        const manualDecorators = command.manualDecorators;
        manualDecoratorDefinitions.forEach((decoratorDefinition)=>{
            editor.model.schema.extend('$text', {
                allowAttributes: decoratorDefinition.id
            });
            // Keeps reference to manual decorator to decode its name to attributes during downcast.
            const decorator = new ManualDecorator(decoratorDefinition);
            manualDecorators.add(decorator);
            editor.conversion.for('downcast').attributeToElement({
                model: decorator.id,
                view: (manualDecoratorValue, { writer, schema }, { item })=>{
                    // Manual decorators for block links are handled e.g. in LinkImageEditing.
                    if (!(item.is('selection') || schema.isInline(item))) {
                        return;
                    }
                    if (manualDecoratorValue) {
                        const element = writer.createAttributeElement('a', decorator.attributes, {
                            priority: 5
                        });
                        if (decorator.classes) {
                            writer.addClass(decorator.classes, element);
                        }
                        for(const key in decorator.styles){
                            writer.setStyle(key, decorator.styles[key], element);
                        }
                        writer.setCustomProperty('link', true, element);
                        return element;
                    }
                }
            });
            editor.conversion.for('upcast').elementToAttribute({
                view: {
                    name: 'a',
                    ...decorator._createPattern()
                },
                model: {
                    key: decorator.id
                }
            });
        });
    }
    /**
	 * Attaches handlers for {@link module:engine/view/document~Document#event:enter} and
	 * {@link module:engine/view/document~Document#event:click} to enable link following.
	 */ _enableLinkOpen() {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;
        this.listenTo(viewDocument, 'click', (evt, data)=>{
            const shouldOpen = env.isMac ? data.domEvent.metaKey : data.domEvent.ctrlKey;
            if (!shouldOpen) {
                return;
            }
            let clickedElement = data.domTarget;
            if (clickedElement.tagName.toLowerCase() != 'a') {
                clickedElement = clickedElement.closest('a');
            }
            if (!clickedElement) {
                return;
            }
            const url = clickedElement.getAttribute('href');
            if (!url) {
                return;
            }
            evt.stop();
            data.preventDefault();
            openLink(url);
        }, {
            context: '$capture'
        });
        // Open link on Alt+Enter.
        this.listenTo(viewDocument, 'keydown', (evt, data)=>{
            const linkCommand = editor.commands.get('link');
            const url = linkCommand.value;
            const shouldOpen = !!url && data.keyCode === keyCodes.enter && data.altKey;
            if (!shouldOpen) {
                return;
            }
            evt.stop();
            openLink(url);
        });
    }
    /**
	 * Watches the DocumentSelection attribute changes and removes link decorator attributes when the linkHref attribute is removed.
	 *
	 * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
	 */ _enableSelectionAttributesFixer() {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;
        this.listenTo(selection, 'change:attribute', (evt, { attributeKeys })=>{
            if (!attributeKeys.includes('linkHref') || selection.hasAttribute('linkHref')) {
                return;
            }
            model.change((writer)=>{
                removeLinkAttributesFromSelection(writer, getLinkAttributesAllowedOnText(model.schema));
            });
        });
    }
    /**
	 * Enables URL fixing on pasting.
	 */ _enableClipboardIntegration() {
        const editor = this.editor;
        const model = editor.model;
        const defaultProtocol = this.editor.config.get('link.defaultProtocol');
        if (!defaultProtocol) {
            return;
        }
        this.listenTo(editor.plugins.get('ClipboardPipeline'), 'contentInsertion', (evt, data)=>{
            model.change((writer)=>{
                const range = writer.createRangeIn(data.content);
                for (const item of range.getItems()){
                    if (item.hasAttribute('linkHref')) {
                        const newLink = addLinkProtocolIfApplicable(item.getAttribute('linkHref'), defaultProtocol);
                        writer.setAttribute('linkHref', newLink, item);
                    }
                }
            });
        });
    }
}
/**
 * Make the selection free of link-related model attributes.
 * All link-related model attributes start with "link". That includes not only "linkHref"
 * but also all decorator attributes (they have dynamic names), or even custom plugins.
 */ function removeLinkAttributesFromSelection(writer, linkAttributes) {
    writer.removeSelectionAttribute('linkHref');
    for (const attribute of linkAttributes){
        writer.removeSelectionAttribute(attribute);
    }
}
/**
 * Returns an array containing names of the attributes allowed on `$text` that describes the link item.
 */ function getLinkAttributesAllowedOnText(schema) {
    const textAttributes = schema.getDefinition('$text').allowAttributes;
    return textAttributes.filter((attribute)=>attribute.startsWith('link'));
}

/**
 * The link form view controller class.
 *
 * See {@link module:link/ui/linkformview~LinkFormView}.
 */ class LinkFormView extends View {
    /**
	 * Tracks information about DOM focus in the form.
	 */ focusTracker = new FocusTracker();
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes = new KeystrokeHandler();
    /**
	 * The URL input view.
	 */ urlInputView;
    /**
	 * The Save button view.
	 */ saveButtonView;
    /**
	 * The Cancel button view.
	 */ cancelButtonView;
    /**
	 * A collection of {@link module:ui/button/switchbuttonview~SwitchButtonView},
	 * which corresponds to {@link module:link/linkcommand~LinkCommand#manualDecorators manual decorators}
	 * configured in the editor.
	 */ _manualDecoratorSwitches;
    /**
	 * A collection of child views in the form.
	 */ children;
    /**
	 * An array of form validators used by {@link #isValid}.
	 */ _validators;
    /**
	 * A collection of views that can be focused in the form.
	 */ _focusables = new ViewCollection();
    /**
	 * Helps cycling over {@link #_focusables} in the form.
	 */ _focusCycler;
    /**
	 * Creates an instance of the {@link module:link/ui/linkformview~LinkFormView} class.
	 *
	 * Also see {@link #render}.
	 *
	 * @param locale The localization services instance.
	 * @param linkCommand Reference to {@link module:link/linkcommand~LinkCommand}.
	 * @param validators  Form validators used by {@link #isValid}.
	 */ constructor(locale, linkCommand, validators){
        super(locale);
        const t = locale.t;
        this._validators = validators;
        this.urlInputView = this._createUrlInput();
        this.saveButtonView = this._createButton(t('Save'), icons.check, 'ck-button-save');
        this.saveButtonView.type = 'submit';
        this.cancelButtonView = this._createButton(t('Cancel'), icons.cancel, 'ck-button-cancel', 'cancel');
        this._manualDecoratorSwitches = this._createManualDecoratorSwitches(linkCommand);
        this.children = this._createFormChildren(linkCommand.manualDecorators);
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
        const classList = [
            'ck',
            'ck-link-form',
            'ck-responsive-form'
        ];
        if (linkCommand.manualDecorators.length) {
            classList.push('ck-link-form_layout-vertical', 'ck-vertical-form');
        }
        this.setTemplate({
            tag: 'form',
            attributes: {
                class: classList,
                // https://github.com/ckeditor/ckeditor5-link/issues/90
                tabindex: '-1'
            },
            children: this.children
        });
    }
    /**
	 * Obtains the state of the {@link module:ui/button/switchbuttonview~SwitchButtonView switch buttons} representing
	 * {@link module:link/linkcommand~LinkCommand#manualDecorators manual link decorators}
	 * in the {@link module:link/ui/linkformview~LinkFormView}.
	 *
	 * @returns Key-value pairs, where the key is the name of the decorator and the value is its state.
	 */ getDecoratorSwitchesState() {
        return Array.from(this._manualDecoratorSwitches).reduce((accumulator, switchButton)=>{
            accumulator[switchButton.name] = switchButton.isOn;
            return accumulator;
        }, {});
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        submitHandler({
            view: this
        });
        const childViews = [
            this.urlInputView,
            ...this._manualDecoratorSwitches,
            this.saveButtonView,
            this.cancelButtonView
        ];
        childViews.forEach((v)=>{
            // Register the view as focusable.
            this._focusables.add(v);
            // Register the view in the focus tracker.
            this.focusTracker.add(v.element);
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
	 * Focuses the fist {@link #_focusables} in the form.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Validates the form and returns `false` when some fields are invalid.
	 */ isValid() {
        this.resetFormStatus();
        for (const validator of this._validators){
            const errorText = validator(this);
            // One error per field is enough.
            if (errorText) {
                // Apply updated error.
                this.urlInputView.errorText = errorText;
                return false;
            }
        }
        return true;
    }
    /**
	 * Cleans up the supplementary error and information text of the {@link #urlInputView}
	 * bringing them back to the state when the form has been displayed for the first time.
	 *
	 * See {@link #isValid}.
	 */ resetFormStatus() {
        this.urlInputView.errorText = null;
    }
    /**
	 * Creates a labeled input view.
	 *
	 * @returns Labeled field view instance.
	 */ _createUrlInput() {
        const t = this.locale.t;
        const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
        labeledInput.fieldView.inputMode = 'url';
        labeledInput.label = t('Link URL');
        return labeledInput;
    }
    /**
	 * Creates a button view.
	 *
	 * @param label The button label.
	 * @param icon The button icon.
	 * @param className The additional button CSS class name.
	 * @param eventName An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns The button view instance.
	 */ _createButton(label, icon, className, eventName) {
        const button = new ButtonView(this.locale);
        button.set({
            label,
            icon,
            tooltip: true
        });
        button.extendTemplate({
            attributes: {
                class: className
            }
        });
        if (eventName) {
            button.delegate('execute').to(this, eventName);
        }
        return button;
    }
    /**
	 * Populates {@link module:ui/viewcollection~ViewCollection} of {@link module:ui/button/switchbuttonview~SwitchButtonView}
	 * made based on {@link module:link/linkcommand~LinkCommand#manualDecorators}.
	 *
	 * @param linkCommand A reference to the link command.
	 * @returns ViewCollection of switch buttons.
	 */ _createManualDecoratorSwitches(linkCommand) {
        const switches = this.createCollection();
        for (const manualDecorator of linkCommand.manualDecorators){
            const switchButton = new SwitchButtonView(this.locale);
            switchButton.set({
                name: manualDecorator.id,
                label: manualDecorator.label,
                withText: true
            });
            switchButton.bind('isOn').toMany([
                manualDecorator,
                linkCommand
            ], 'value', (decoratorValue, commandValue)=>{
                return commandValue === undefined && decoratorValue === undefined ? !!manualDecorator.defaultValue : !!decoratorValue;
            });
            switchButton.on('execute', ()=>{
                manualDecorator.set('value', !switchButton.isOn);
            });
            switches.add(switchButton);
        }
        return switches;
    }
    /**
	 * Populates the {@link #children} collection of the form.
	 *
	 * If {@link module:link/linkcommand~LinkCommand#manualDecorators manual decorators} are configured in the editor, it creates an
	 * additional `View` wrapping all {@link #_manualDecoratorSwitches} switch buttons corresponding
	 * to these decorators.
	 *
	 * @param manualDecorators A reference to
	 * the collection of manual decorators stored in the link command.
	 * @returns The children of link form view.
	 */ _createFormChildren(manualDecorators) {
        const children = this.createCollection();
        children.add(this.urlInputView);
        if (manualDecorators.length) {
            const additionalButtonsView = new View();
            additionalButtonsView.setTemplate({
                tag: 'ul',
                children: this._manualDecoratorSwitches.map((switchButton)=>({
                        tag: 'li',
                        children: [
                            switchButton
                        ],
                        attributes: {
                            class: [
                                'ck',
                                'ck-list__item'
                            ]
                        }
                    })),
                attributes: {
                    class: [
                        'ck',
                        'ck-reset',
                        'ck-list'
                    ]
                }
            });
            children.add(additionalButtonsView);
        }
        children.add(this.saveButtonView);
        children.add(this.cancelButtonView);
        return children;
    }
    /**
	 * The native DOM `value` of the {@link #urlInputView} element.
	 *
	 * **Note**: Do not confuse it with the {@link module:ui/inputtext/inputtextview~InputTextView#value}
	 * which works one way only and may not represent the actual state of the component in the DOM.
	 */ get url() {
        const { element } = this.urlInputView.fieldView;
        if (!element) {
            return null;
        }
        return element.value.trim();
    }
}

var unlinkIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m11.077 15 .991-1.416a.75.75 0 1 1 1.229.86l-1.148 1.64a.748.748 0 0 1-.217.206 5.251 5.251 0 0 1-8.503-5.955.741.741 0 0 1 .12-.274l1.147-1.639a.75.75 0 1 1 1.228.86L4.933 10.7l.006.003a3.75 3.75 0 0 0 6.132 4.294l.006.004zm5.494-5.335a.748.748 0 0 1-.12.274l-1.147 1.639a.75.75 0 1 1-1.228-.86l.86-1.23a3.75 3.75 0 0 0-6.144-4.301l-.86 1.229a.75.75 0 0 1-1.229-.86l1.148-1.64a.748.748 0 0 1 .217-.206 5.251 5.251 0 0 1 8.503 5.955zm-4.563-2.532a.75.75 0 0 1 .184 1.045l-3.155 4.505a.75.75 0 1 1-1.229-.86l3.155-4.506a.75.75 0 0 1 1.045-.184zm4.919 10.562-1.414 1.414a.75.75 0 1 1-1.06-1.06l1.414-1.415-1.415-1.414a.75.75 0 0 1 1.061-1.06l1.414 1.414 1.414-1.415a.75.75 0 0 1 1.061 1.061l-1.414 1.414 1.414 1.415a.75.75 0 0 1-1.06 1.06l-1.415-1.414z\"/></svg>";

/**
 * The link actions view class. This view displays the link preview, allows
 * unlinking or editing the link.
 */ class LinkActionsView extends View {
    /**
	 * Tracks information about DOM focus in the actions.
	 */ focusTracker = new FocusTracker();
    /**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */ keystrokes = new KeystrokeHandler();
    /**
	 * The href preview view.
	 */ previewButtonView;
    /**
	 * The unlink button view.
	 */ unlinkButtonView;
    /**
	 * The edit link button view.
	 */ editButtonView;
    /**
	 * A collection of views that can be focused in the view.
	 */ _focusables = new ViewCollection();
    /**
	 * Helps cycling over {@link #_focusables} in the view.
	 */ _focusCycler;
    _linkConfig;
    /**
	 * @inheritDoc
	 */ constructor(locale, linkConfig = {}){
        super(locale);
        const t = locale.t;
        this.previewButtonView = this._createPreviewButton();
        this.unlinkButtonView = this._createButton(t('Unlink'), unlinkIcon, 'unlink');
        this.editButtonView = this._createButton(t('Edit link'), icons.pencil, 'edit');
        this.set('href', undefined);
        this._linkConfig = linkConfig;
        this._focusCycler = new FocusCycler({
            focusables: this._focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate fields backwards using the Shift + Tab keystroke.
                focusPrevious: 'shift + tab',
                // Navigate fields forwards using the Tab key.
                focusNext: 'tab'
            }
        });
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-link-actions',
                    'ck-responsive-form'
                ],
                // https://github.com/ckeditor/ckeditor5-link/issues/90
                tabindex: '-1'
            },
            children: [
                this.previewButtonView,
                this.editButtonView,
                this.unlinkButtonView
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ render() {
        super.render();
        const childViews = [
            this.previewButtonView,
            this.editButtonView,
            this.unlinkButtonView
        ];
        childViews.forEach((v)=>{
            // Register the view as focusable.
            this._focusables.add(v);
            // Register the view in the focus tracker.
            this.focusTracker.add(v.element);
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
	 * Focuses the fist {@link #_focusables} in the actions.
	 */ focus() {
        this._focusCycler.focusFirst();
    }
    /**
	 * Creates a button view.
	 *
	 * @param label The button label.
	 * @param icon The button icon.
	 * @param eventName An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns The button view instance.
	 */ _createButton(label, icon, eventName) {
        const button = new ButtonView(this.locale);
        button.set({
            label,
            icon,
            tooltip: true
        });
        button.delegate('execute').to(this, eventName);
        return button;
    }
    /**
	 * Creates a link href preview button.
	 *
	 * @returns The button view instance.
	 */ _createPreviewButton() {
        const button = new ButtonView(this.locale);
        const bind = this.bindTemplate;
        const t = this.t;
        button.set({
            withText: true,
            tooltip: t('Open link in new tab')
        });
        button.extendTemplate({
            attributes: {
                class: [
                    'ck',
                    'ck-link-actions__preview'
                ],
                href: bind.to('href', (href)=>href && ensureSafeUrl(href, this._linkConfig.allowedProtocols)),
                target: '_blank',
                rel: 'noopener noreferrer'
            }
        });
        button.bind('label').to(this, 'href', (href)=>{
            return href || t('This link has no URL');
        });
        button.bind('isEnabled').to(this, 'href', (href)=>!!href);
        button.template.tag = 'a';
        button.template.eventListeners = {};
        return button;
    }
}

var linkIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m11.077 15 .991-1.416a.75.75 0 1 1 1.229.86l-1.148 1.64a.748.748 0 0 1-.217.206 5.251 5.251 0 0 1-8.503-5.955.741.741 0 0 1 .12-.274l1.147-1.639a.75.75 0 1 1 1.228.86L4.933 10.7l.006.003a3.75 3.75 0 0 0 6.132 4.294l.006.004zm5.494-5.335a.748.748 0 0 1-.12.274l-1.147 1.639a.75.75 0 1 1-1.228-.86l.86-1.23a3.75 3.75 0 0 0-6.144-4.301l-.86 1.229a.75.75 0 0 1-1.229-.86l1.148-1.64a.748.748 0 0 1 .217-.206 5.251 5.251 0 0 1 8.503 5.955zm-4.563-2.532a.75.75 0 0 1 .184 1.045l-3.155 4.505a.75.75 0 1 1-1.229-.86l3.155-4.506a.75.75 0 0 1 1.045-.184z\"/></svg>";

const VISUAL_SELECTION_MARKER_NAME = 'link-ui';
/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 *
 * It uses the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon plugin}.
 */ class LinkUI extends Plugin {
    /**
	 * The actions view displayed inside of the balloon.
	 */ actionsView = null;
    /**
	 * The form view displayed inside the balloon.
	 */ formView = null;
    /**
	 * The contextual balloon plugin instance.
	 */ _balloon;
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ContextualBalloon
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'LinkUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = this.editor.t;
        editor.editing.view.addObserver(ClickObserver);
        this._balloon = editor.plugins.get(ContextualBalloon);
        // Create toolbar buttons.
        this._createToolbarLinkButton();
        this._enableBalloonActivators();
        // Renders a fake visual selection marker on an expanded selection.
        editor.conversion.for('editingDowncast').markerToHighlight({
            model: VISUAL_SELECTION_MARKER_NAME,
            view: {
                classes: [
                    'ck-fake-link-selection'
                ]
            }
        });
        // Renders a fake visual selection marker on a collapsed selection.
        editor.conversion.for('editingDowncast').markerToElement({
            model: VISUAL_SELECTION_MARKER_NAME,
            view: {
                name: 'span',
                classes: [
                    'ck-fake-link-selection',
                    'ck-fake-link-selection_collapsed'
                ]
            }
        });
        // Add the information about the keystrokes to the accessibility database.
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Create link'),
                    keystroke: LINK_KEYSTROKE
                },
                {
                    label: t('Move out of a link'),
                    keystroke: [
                        [
                            'arrowleft',
                            'arrowleft'
                        ],
                        [
                            'arrowright',
                            'arrowright'
                        ]
                    ]
                }
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        super.destroy();
        // Destroy created UI components as they are not automatically destroyed (see ckeditor5#1341).
        if (this.formView) {
            this.formView.destroy();
        }
        if (this.actionsView) {
            this.actionsView.destroy();
        }
    }
    /**
	 * Creates views.
	 */ _createViews() {
        this.actionsView = this._createActionsView();
        this.formView = this._createFormView();
        // Attach lifecycle actions to the the balloon.
        this._enableUserBalloonInteractions();
    }
    /**
	 * Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
	 */ _createActionsView() {
        const editor = this.editor;
        const actionsView = new LinkActionsView(editor.locale, editor.config.get('link'));
        const linkCommand = editor.commands.get('link');
        const unlinkCommand = editor.commands.get('unlink');
        actionsView.bind('href').to(linkCommand, 'value');
        actionsView.editButtonView.bind('isEnabled').to(linkCommand);
        actionsView.unlinkButtonView.bind('isEnabled').to(unlinkCommand);
        // Execute unlink command after clicking on the "Edit" button.
        this.listenTo(actionsView, 'edit', ()=>{
            this._addFormView();
        });
        // Execute unlink command after clicking on the "Unlink" button.
        this.listenTo(actionsView, 'unlink', ()=>{
            editor.execute('unlink');
            this._hideUI();
        });
        // Close the panel on esc key press when the **actions have focus**.
        actionsView.keystrokes.set('Esc', (data, cancel)=>{
            this._hideUI();
            cancel();
        });
        // Open the form view on Ctrl+K when the **actions have focus**..
        actionsView.keystrokes.set(LINK_KEYSTROKE, (data, cancel)=>{
            this._addFormView();
            cancel();
        });
        return actionsView;
    }
    /**
	 * Creates the {@link module:link/ui/linkformview~LinkFormView} instance.
	 */ _createFormView() {
        const editor = this.editor;
        const linkCommand = editor.commands.get('link');
        const defaultProtocol = editor.config.get('link.defaultProtocol');
        const formView = new (CssTransitionDisablerMixin(LinkFormView))(editor.locale, linkCommand, getFormValidators(editor));
        formView.urlInputView.fieldView.bind('value').to(linkCommand, 'value');
        // Form elements should be read-only when corresponding commands are disabled.
        formView.urlInputView.bind('isEnabled').to(linkCommand, 'isEnabled');
        // Disable the "save" button if the command is disabled.
        formView.saveButtonView.bind('isEnabled').to(linkCommand, 'isEnabled');
        // Execute link command after clicking the "Save" button.
        this.listenTo(formView, 'submit', ()=>{
            if (formView.isValid()) {
                const { value } = formView.urlInputView.fieldView.element;
                const parsedUrl = addLinkProtocolIfApplicable(value, defaultProtocol);
                editor.execute('link', parsedUrl, formView.getDecoratorSwitchesState());
                this._closeFormView();
            }
        });
        // Update balloon position when form error changes.
        this.listenTo(formView.urlInputView, 'change:errorText', ()=>{
            editor.ui.update();
        });
        // Hide the panel after clicking the "Cancel" button.
        this.listenTo(formView, 'cancel', ()=>{
            this._closeFormView();
        });
        // Close the panel on esc key press when the **form has focus**.
        formView.keystrokes.set('Esc', (data, cancel)=>{
            this._closeFormView();
            cancel();
        });
        return formView;
    }
    /**
	 * Creates a toolbar Link button. Clicking this button will show
	 * a {@link #_balloon} attached to the selection.
	 */ _createToolbarLinkButton() {
        const editor = this.editor;
        const linkCommand = editor.commands.get('link');
        editor.ui.componentFactory.add('link', ()=>{
            const button = this._createButton(ButtonView);
            button.set({
                tooltip: true,
                isToggleable: true
            });
            button.bind('isOn').to(linkCommand, 'value', (value)=>!!value);
            return button;
        });
        editor.ui.componentFactory.add('menuBar:link', ()=>{
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
	 * Creates a button for link command to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = editor.commands.get('link');
        const view = new ButtonClass(editor.locale);
        const t = locale.t;
        view.set({
            label: t('Link'),
            icon: linkIcon,
            keystroke: LINK_KEYSTROKE
        });
        view.bind('isEnabled').to(command, 'isEnabled');
        // Show the panel on button click.
        this.listenTo(view, 'execute', ()=>this._showUI(true));
        return view;
    }
    /**
	 * Attaches actions that control whether the balloon panel containing the
	 * {@link #formView} should be displayed.
	 */ _enableBalloonActivators() {
        const editor = this.editor;
        const viewDocument = editor.editing.view.document;
        // Handle click on view document and show panel when selection is placed inside the link element.
        // Keep panel open until selection will be inside the same link element.
        this.listenTo(viewDocument, 'click', ()=>{
            const parentLink = this._getSelectedLinkElement();
            if (parentLink) {
                // Then show panel but keep focus inside editor editable.
                this._showUI();
            }
        });
        // Handle the `Ctrl+K` keystroke and show the panel.
        editor.keystrokes.set(LINK_KEYSTROKE, (keyEvtData, cancel)=>{
            // Prevent focusing the search bar in FF, Chrome and Edge. See https://github.com/ckeditor/ckeditor5/issues/4811.
            cancel();
            if (editor.commands.get('link').isEnabled) {
                this._showUI(true);
            }
        });
    }
    /**
	 * Attaches actions that control whether the balloon panel containing the
	 * {@link #formView} is visible or not.
	 */ _enableUserBalloonInteractions() {
        // Focus the form if the balloon is visible and the Tab key has been pressed.
        this.editor.keystrokes.set('Tab', (data, cancel)=>{
            if (this._areActionsVisible && !this.actionsView.focusTracker.isFocused) {
                this.actionsView.focus();
                cancel();
            }
        }, {
            // Use the high priority because the link UI navigation is more important
            // than other feature's actions, e.g. list indentation.
            // https://github.com/ckeditor/ckeditor5-link/issues/146
            priority: 'high'
        });
        // Close the panel on the Esc key press when the editable has focus and the balloon is visible.
        this.editor.keystrokes.set('Esc', (data, cancel)=>{
            if (this._isUIVisible) {
                this._hideUI();
                cancel();
            }
        });
        // Close on click outside of balloon panel element.
        clickOutsideHandler({
            emitter: this.formView,
            activator: ()=>this._isUIInPanel,
            contextElements: ()=>[
                    this._balloon.view.element
                ],
            callback: ()=>this._hideUI()
        });
    }
    /**
	 * Adds the {@link #actionsView} to the {@link #_balloon}.
	 *
	 * @internal
	 */ _addActionsView() {
        if (!this.actionsView) {
            this._createViews();
        }
        if (this._areActionsInPanel) {
            return;
        }
        this._balloon.add({
            view: this.actionsView,
            position: this._getBalloonPositionData()
        });
    }
    /**
	 * Adds the {@link #formView} to the {@link #_balloon}.
	 */ _addFormView() {
        if (!this.formView) {
            this._createViews();
        }
        if (this._isFormInPanel) {
            return;
        }
        const editor = this.editor;
        const linkCommand = editor.commands.get('link');
        this.formView.disableCssTransitions();
        this.formView.resetFormStatus();
        this._balloon.add({
            view: this.formView,
            position: this._getBalloonPositionData()
        });
        // Make sure that each time the panel shows up, the URL field remains in sync with the value of
        // the command. If the user typed in the input, then canceled the balloon (`urlInputView.fieldView#value` stays
        // unaltered) and re-opened it without changing the value of the link command (e.g. because they
        // clicked the same link), they would see the old value instead of the actual value of the command.
        // https://github.com/ckeditor/ckeditor5-link/issues/78
        // https://github.com/ckeditor/ckeditor5-link/issues/123
        this.formView.urlInputView.fieldView.value = linkCommand.value || '';
        // Select input when form view is currently visible.
        if (this._balloon.visibleView === this.formView) {
            this.formView.urlInputView.fieldView.select();
        }
        this.formView.enableCssTransitions();
    }
    /**
	 * Closes the form view. Decides whether the balloon should be hidden completely or if the action view should be shown. This is
	 * decided upon the link command value (which has a value if the document selection is in the link).
	 *
	 * Additionally, if any {@link module:link/linkconfig~LinkConfig#decorators} are defined in the editor configuration, the state of
	 * switch buttons responsible for manual decorator handling is restored.
	 */ _closeFormView() {
        const linkCommand = this.editor.commands.get('link');
        // Restore manual decorator states to represent the current model state. This case is important to reset the switch buttons
        // when the user cancels the editing form.
        linkCommand.restoreManualDecoratorStates();
        if (linkCommand.value !== undefined) {
            this._removeFormView();
        } else {
            this._hideUI();
        }
    }
    /**
	 * Removes the {@link #formView} from the {@link #_balloon}.
	 */ _removeFormView() {
        if (this._isFormInPanel) {
            // Blur the input element before removing it from DOM to prevent issues in some browsers.
            // See https://github.com/ckeditor/ckeditor5/issues/1501.
            this.formView.saveButtonView.focus();
            // Reset the URL field to update the state of the submit button.
            this.formView.urlInputView.fieldView.reset();
            this._balloon.remove(this.formView);
            // Because the form has an input which has focus, the focus must be brought back
            // to the editor. Otherwise, it would be lost.
            this.editor.editing.view.focus();
            this._hideFakeVisualSelection();
        }
    }
    /**
	 * Shows the correct UI type. It is either {@link #formView} or {@link #actionsView}.
	 *
	 * @internal
	 */ _showUI(forceVisible = false) {
        if (!this.formView) {
            this._createViews();
        }
        // When there's no link under the selection, go straight to the editing UI.
        if (!this._getSelectedLinkElement()) {
            // Show visual selection on a text without a link when the contextual balloon is displayed.
            // See https://github.com/ckeditor/ckeditor5/issues/4721.
            this._showFakeVisualSelection();
            this._addActionsView();
            // Be sure panel with link is visible.
            if (forceVisible) {
                this._balloon.showStack('main');
            }
            this._addFormView();
        } else {
            // Go to the editing UI if actions are already visible.
            if (this._areActionsVisible) {
                this._addFormView();
            } else {
                this._addActionsView();
            }
            // Be sure panel with link is visible.
            if (forceVisible) {
                this._balloon.showStack('main');
            }
        }
        // Begin responding to ui#update once the UI is added.
        this._startUpdatingUI();
    }
    /**
	 * Removes the {@link #formView} from the {@link #_balloon}.
	 *
	 * See {@link #_addFormView}, {@link #_addActionsView}.
	 */ _hideUI() {
        if (!this._isUIInPanel) {
            return;
        }
        const editor = this.editor;
        this.stopListening(editor.ui, 'update');
        this.stopListening(this._balloon, 'change:visibleView');
        // Make sure the focus always gets back to the editable _before_ removing the focused form view.
        // Doing otherwise causes issues in some browsers. See https://github.com/ckeditor/ckeditor5-link/issues/193.
        editor.editing.view.focus();
        // Remove form first because it's on top of the stack.
        this._removeFormView();
        // Then remove the actions view because it's beneath the form.
        this._balloon.remove(this.actionsView);
        this._hideFakeVisualSelection();
    }
    /**
	 * Makes the UI react to the {@link module:ui/editorui/editorui~EditorUI#event:update} event to
	 * reposition itself when the editor UI should be refreshed.
	 *
	 * See: {@link #_hideUI} to learn when the UI stops reacting to the `update` event.
	 */ _startUpdatingUI() {
        const editor = this.editor;
        const viewDocument = editor.editing.view.document;
        let prevSelectedLink = this._getSelectedLinkElement();
        let prevSelectionParent = getSelectionParent();
        const update = ()=>{
            const selectedLink = this._getSelectedLinkElement();
            const selectionParent = getSelectionParent();
            // Hide the panel if:
            //
            // * the selection went out of the EXISTING link element. E.g. user moved the caret out
            //   of the link,
            // * the selection went to a different parent when creating a NEW link. E.g. someone
            //   else modified the document.
            // * the selection has expanded (e.g. displaying link actions then pressing SHIFT+Right arrow).
            //
            // Note: #_getSelectedLinkElement will return a link for a non-collapsed selection only
            // when fully selected.
            if (prevSelectedLink && !selectedLink || !prevSelectedLink && selectionParent !== prevSelectionParent) {
                this._hideUI();
            } else if (this._isUIVisible) {
                // If still in a link element, simply update the position of the balloon.
                // If there was no link (e.g. inserting one), the balloon must be moved
                // to the new position in the editing view (a new native DOM range).
                this._balloon.updatePosition(this._getBalloonPositionData());
            }
            prevSelectedLink = selectedLink;
            prevSelectionParent = selectionParent;
        };
        function getSelectionParent() {
            return viewDocument.selection.focus.getAncestors().reverse().find((node)=>node.is('element'));
        }
        this.listenTo(editor.ui, 'update', update);
        this.listenTo(this._balloon, 'change:visibleView', update);
    }
    /**
	 * Returns `true` when {@link #formView} is in the {@link #_balloon}.
	 */ get _isFormInPanel() {
        return !!this.formView && this._balloon.hasView(this.formView);
    }
    /**
	 * Returns `true` when {@link #actionsView} is in the {@link #_balloon}.
	 */ get _areActionsInPanel() {
        return !!this.actionsView && this._balloon.hasView(this.actionsView);
    }
    /**
	 * Returns `true` when {@link #actionsView} is in the {@link #_balloon} and it is
	 * currently visible.
	 */ get _areActionsVisible() {
        return !!this.actionsView && this._balloon.visibleView === this.actionsView;
    }
    /**
	 * Returns `true` when {@link #actionsView} or {@link #formView} is in the {@link #_balloon}.
	 */ get _isUIInPanel() {
        return this._isFormInPanel || this._areActionsInPanel;
    }
    /**
	 * Returns `true` when {@link #actionsView} or {@link #formView} is in the {@link #_balloon} and it is
	 * currently visible.
	 */ get _isUIVisible() {
        const visibleView = this._balloon.visibleView;
        return !!this.formView && visibleView == this.formView || this._areActionsVisible;
    }
    /**
	 * Returns positioning options for the {@link #_balloon}. They control the way the balloon is attached
	 * to the target element or selection.
	 *
	 * If the selection is collapsed and inside a link element, the panel will be attached to the
	 * entire link element. Otherwise, it will be attached to the selection.
	 */ _getBalloonPositionData() {
        const view = this.editor.editing.view;
        const model = this.editor.model;
        const viewDocument = view.document;
        let target;
        if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
            // There are cases when we highlight selection using a marker (#7705, #4721).
            const markerViewElements = Array.from(this.editor.editing.mapper.markerNameToElements(VISUAL_SELECTION_MARKER_NAME));
            const newRange = view.createRange(view.createPositionBefore(markerViewElements[0]), view.createPositionAfter(markerViewElements[markerViewElements.length - 1]));
            target = view.domConverter.viewRangeToDom(newRange);
        } else {
            // Make sure the target is calculated on demand at the last moment because a cached DOM range
            // (which is very fragile) can desynchronize with the state of the editing view if there was
            // any rendering done in the meantime. This can happen, for instance, when an inline widget
            // gets unlinked.
            target = ()=>{
                const targetLink = this._getSelectedLinkElement();
                return targetLink ? // When selection is inside link element, then attach panel to this element.
                view.domConverter.mapViewToDom(targetLink) : // Otherwise attach panel to the selection.
                view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());
            };
        }
        return {
            target
        };
    }
    /**
	 * Returns the link {@link module:engine/view/attributeelement~AttributeElement} under
	 * the {@link module:engine/view/document~Document editing view's} selection or `null`
	 * if there is none.
	 *
	 * **Note**: For a non–collapsed selection, the link element is returned when **fully**
	 * selected and the **only** element within the selection boundaries, or when
	 * a linked widget is selected.
	 */ _getSelectedLinkElement() {
        const view = this.editor.editing.view;
        const selection = view.document.selection;
        const selectedElement = selection.getSelectedElement();
        // The selection is collapsed or some widget is selected (especially inline widget).
        if (selection.isCollapsed || selectedElement && isWidget(selectedElement)) {
            return findLinkElementAncestor(selection.getFirstPosition());
        } else {
            // The range for fully selected link is usually anchored in adjacent text nodes.
            // Trim it to get closer to the actual link element.
            const range = selection.getFirstRange().getTrimmed();
            const startLink = findLinkElementAncestor(range.start);
            const endLink = findLinkElementAncestor(range.end);
            if (!startLink || startLink != endLink) {
                return null;
            }
            // Check if the link element is fully selected.
            if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
                return startLink;
            } else {
                return null;
            }
        }
    }
    /**
	 * Displays a fake visual selection when the contextual balloon is displayed.
	 *
	 * This adds a 'link-ui' marker into the document that is rendered as a highlight on selected text fragment.
	 */ _showFakeVisualSelection() {
        const model = this.editor.model;
        model.change((writer)=>{
            const range = model.document.selection.getFirstRange();
            if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
                writer.updateMarker(VISUAL_SELECTION_MARKER_NAME, {
                    range
                });
            } else {
                if (range.start.isAtEnd) {
                    const startPosition = range.start.getLastMatchingPosition(({ item })=>!model.schema.isContent(item), {
                        boundaries: range
                    });
                    writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
                        usingOperation: false,
                        affectsData: false,
                        range: writer.createRange(startPosition, range.end)
                    });
                } else {
                    writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
                        usingOperation: false,
                        affectsData: false,
                        range
                    });
                }
            }
        });
    }
    /**
	 * Hides the fake visual selection created in {@link #_showFakeVisualSelection}.
	 */ _hideFakeVisualSelection() {
        const model = this.editor.model;
        if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
            model.change((writer)=>{
                writer.removeMarker(VISUAL_SELECTION_MARKER_NAME);
            });
        }
    }
}
/**
 * Returns a link element if there's one among the ancestors of the provided `Position`.
 *
 * @param View position to analyze.
 * @returns Link element at the position or null.
 */ function findLinkElementAncestor(position) {
    return position.getAncestors().find((ancestor)=>isLinkElement(ancestor)) || null;
}
/**
 * Returns link form validation callbacks.
 *
 * @param editor Editor instance.
 */ function getFormValidators(editor) {
    const t = editor.t;
    const allowCreatingEmptyLinks = editor.config.get('link.allowCreatingEmptyLinks');
    return [
        (form)=>{
            if (!allowCreatingEmptyLinks && !form.url.length) {
                return t('Link URL must not be empty.');
            }
        }
    ];
}

const MIN_LINK_LENGTH_WITH_SPACE_AT_END = 4; // Ie: "t.co " (length 5).
// This was a tweak from https://gist.github.com/dperini/729294.
const URL_REG_EXP = new RegExp(// Group 1: Line start or after a space.
'(^|\\s)' + // Group 2: Detected URL (or e-mail).
'(' + // Protocol identifier or short syntax "//"
// a. Full form http://user@foo.bar.baz:8080/foo/bar.html#baz?foo=bar
'(' + '(?:(?:(?:https?|ftp):)?\\/\\/)' + // BasicAuth using user:pass (optional)
'(?:\\S+(?::\\S*)?@)?' + '(?:' + // IP address dotted notation octets
// excludes loopback network 0.0.0.0
// excludes reserved space >= 224.0.0.0
// excludes network & broadcast addresses
// (first & last IP address of each class)
'(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' + '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' + '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' + '|' + '(' + // Do not allow `www.foo` - see https://github.com/ckeditor/ckeditor5/issues/8050.
'((?!www\\.)|(www\\.))' + // Host & domain names.
'(?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.)+' + // TLD identifier name.
'(?:[a-z\\u00a1-\\uffff]{2,63})' + ')' + ')' + // port number (optional)
'(?::\\d{2,5})?' + // resource path (optional)
'(?:[/?#]\\S*)?' + ')' + '|' + // b. Short form (either www.example.com or example@example.com)
'(' + '(www.|(\\S+@))' + // Host & domain names.
'((?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.))+' + // TLD identifier name.
'(?:[a-z\\u00a1-\\uffff]{2,63})' + ')' + ')$', 'i');
const URL_GROUP_IN_MATCH = 2;
/**
 * The autolink plugin.
 */ class AutoLink extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            Delete,
            LinkEditing
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'AutoLink';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        selection.on('change:range', ()=>{
            // Disable plugin when selection is inside a code block.
            this.isEnabled = !selection.anchor.parent.is('element', 'codeBlock');
        });
        this._enableTypingHandling();
    }
    /**
	 * @inheritDoc
	 */ afterInit() {
        this._enableEnterHandling();
        this._enableShiftEnterHandling();
        this._enablePasteLinking();
    }
    /**
	 * For given position, returns a range that includes the whole link that contains the position.
	 *
	 * If position is not inside a link, returns `null`.
	 */ _expandLinkRange(model, position) {
        if (position.textNode && position.textNode.hasAttribute('linkHref')) {
            return findAttributeRange(position, 'linkHref', position.textNode.getAttribute('linkHref'), model);
        } else {
            return null;
        }
    }
    /**
	 * Extends the document selection to includes all links that intersects with given `selectedRange`.
	 */ _selectEntireLinks(writer, selectedRange) {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;
        const selStart = selection.getFirstPosition();
        const selEnd = selection.getLastPosition();
        let updatedSelection = selectedRange.getJoined(this._expandLinkRange(model, selStart) || selectedRange);
        if (updatedSelection) {
            updatedSelection = updatedSelection.getJoined(this._expandLinkRange(model, selEnd) || selectedRange);
        }
        if (updatedSelection && (updatedSelection.start.isBefore(selStart) || updatedSelection.end.isAfter(selEnd))) {
            // Only update the selection if it changed.
            writer.setSelection(updatedSelection);
        }
    }
    /**
	 * Enables autolinking on pasting a URL when some content is selected.
	 */ _enablePasteLinking() {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;
        const clipboardPipeline = editor.plugins.get('ClipboardPipeline');
        const linkCommand = editor.commands.get('link');
        clipboardPipeline.on('inputTransformation', (evt, data)=>{
            if (!this.isEnabled || !linkCommand.isEnabled || selection.isCollapsed || data.method !== 'paste') {
                // Abort if we are disabled or the selection is collapsed.
                return;
            }
            if (selection.rangeCount > 1) {
                // Abort if there are multiple selection ranges.
                return;
            }
            const selectedRange = selection.getFirstRange();
            const newLink = data.dataTransfer.getData('text/plain');
            if (!newLink) {
                // Abort if there is no plain text on the clipboard.
                return;
            }
            const matches = newLink.match(URL_REG_EXP);
            // If the text in the clipboard has a URL, and that URL is the whole clipboard.
            if (matches && matches[2] === newLink) {
                model.change((writer)=>{
                    this._selectEntireLinks(writer, selectedRange);
                    linkCommand.execute(newLink);
                });
                evt.stop();
            }
        }, {
            priority: 'high'
        });
    }
    /**
	 * Enables autolinking on typing.
	 */ _enableTypingHandling() {
        const editor = this.editor;
        const watcher = new TextWatcher(editor.model, (text)=>{
            // 1. Detect <kbd>Space</kbd> after a text with a potential link.
            if (!isSingleSpaceAtTheEnd(text)) {
                return;
            }
            // 2. Check text before last typed <kbd>Space</kbd>.
            const url = getUrlAtTextEnd(text.substr(0, text.length - 1));
            if (url) {
                return {
                    url
                };
            }
        });
        watcher.on('matched:data', (evt, data)=>{
            const { batch, range, url } = data;
            if (!batch.isTyping) {
                return;
            }
            const linkEnd = range.end.getShiftedBy(-1); // Executed after a space character.
            const linkStart = linkEnd.getShiftedBy(-url.length);
            const linkRange = editor.model.createRange(linkStart, linkEnd);
            this._applyAutoLink(url, linkRange);
        });
        watcher.bind('isEnabled').to(this);
    }
    /**
	 * Enables autolinking on the <kbd>Enter</kbd> key.
	 */ _enableEnterHandling() {
        const editor = this.editor;
        const model = editor.model;
        const enterCommand = editor.commands.get('enter');
        if (!enterCommand) {
            return;
        }
        enterCommand.on('execute', ()=>{
            const position = model.document.selection.getFirstPosition();
            if (!position.parent.previousSibling) {
                return;
            }
            const rangeToCheck = model.createRangeIn(position.parent.previousSibling);
            this._checkAndApplyAutoLinkOnRange(rangeToCheck);
        });
    }
    /**
	 * Enables autolinking on the <kbd>Shift</kbd>+<kbd>Enter</kbd> keyboard shortcut.
	 */ _enableShiftEnterHandling() {
        const editor = this.editor;
        const model = editor.model;
        const shiftEnterCommand = editor.commands.get('shiftEnter');
        if (!shiftEnterCommand) {
            return;
        }
        shiftEnterCommand.on('execute', ()=>{
            const position = model.document.selection.getFirstPosition();
            const rangeToCheck = model.createRange(model.createPositionAt(position.parent, 0), position.getShiftedBy(-1));
            this._checkAndApplyAutoLinkOnRange(rangeToCheck);
        });
    }
    /**
	 * Checks if the passed range contains a linkable text.
	 */ _checkAndApplyAutoLinkOnRange(rangeToCheck) {
        const model = this.editor.model;
        const { text, range } = getLastTextLine(rangeToCheck, model);
        const url = getUrlAtTextEnd(text);
        if (url) {
            const linkRange = model.createRange(range.end.getShiftedBy(-url.length), range.end);
            this._applyAutoLink(url, linkRange);
        }
    }
    /**
	 * Applies a link on a given range if the link should be applied.
	 *
	 * @param url The URL to link.
	 * @param range The text range to apply the link attribute to.
	 */ _applyAutoLink(url, range) {
        const model = this.editor.model;
        const defaultProtocol = this.editor.config.get('link.defaultProtocol');
        const fullUrl = addLinkProtocolIfApplicable(url, defaultProtocol);
        if (!this.isEnabled || !isLinkAllowedOnRange(range, model) || !linkHasProtocol(fullUrl) || linkIsAlreadySet(range)) {
            return;
        }
        this._persistAutoLink(fullUrl, range);
    }
    /**
	 * Enqueues autolink changes in the model.
	 *
	 * @param url The URL to link.
	 * @param range The text range to apply the link attribute to.
	 */ _persistAutoLink(url, range) {
        const model = this.editor.model;
        const deletePlugin = this.editor.plugins.get('Delete');
        // Enqueue change to make undo step.
        model.enqueueChange((writer)=>{
            writer.setAttribute('linkHref', url, range);
            model.enqueueChange(()=>{
                deletePlugin.requestUndoOnBackspace();
            });
        });
    }
}
// Check if text should be evaluated by the plugin in order to reduce number of RegExp checks on whole text.
function isSingleSpaceAtTheEnd(text) {
    return text.length > MIN_LINK_LENGTH_WITH_SPACE_AT_END && text[text.length - 1] === ' ' && text[text.length - 2] !== ' ';
}
function getUrlAtTextEnd(text) {
    const match = URL_REG_EXP.exec(text);
    return match ? match[URL_GROUP_IN_MATCH] : null;
}
function isLinkAllowedOnRange(range, model) {
    return model.schema.checkAttributeInSelection(model.createSelection(range), 'linkHref');
}
function linkIsAlreadySet(range) {
    const item = range.start.nodeAfter;
    return !!item && item.hasAttribute('linkHref');
}

/**
 * The link plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkediting~LinkEditing link editing feature}
 * and {@link module:link/linkui~LinkUI link UI feature}.
 */ class Link extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            LinkEditing,
            LinkUI,
            AutoLink
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Link';
    }
}

/**
 * The link image engine feature.
 *
 * It accepts the `linkHref="url"` attribute in the model for the {@link module:image/image~Image `<imageBlock>`} element
 * which allows linking images.
 */ class LinkImageEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            'ImageEditing',
            'ImageUtils',
            LinkEditing
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'LinkImageEditing';
    }
    /**
	 * @inheritDoc
	 */ afterInit() {
        const editor = this.editor;
        const schema = editor.model.schema;
        if (editor.plugins.has('ImageBlockEditing')) {
            schema.extend('imageBlock', {
                allowAttributes: [
                    'linkHref'
                ]
            });
        }
        editor.conversion.for('upcast').add(upcastLink(editor));
        editor.conversion.for('downcast').add(downcastImageLink(editor));
        // Definitions for decorators are provided by the `link` command and the `LinkEditing` plugin.
        this._enableAutomaticDecorators();
        this._enableManualDecorators();
    }
    /**
	 * Processes {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators} definitions and
	 * attaches proper converters that will work when linking an image.`
	 */ _enableAutomaticDecorators() {
        const editor = this.editor;
        const command = editor.commands.get('link');
        const automaticDecorators = command.automaticDecorators;
        if (automaticDecorators.length) {
            editor.conversion.for('downcast').add(automaticDecorators.getDispatcherForLinkedImage());
        }
    }
    /**
	 * Processes transformed {@link module:link/utils/manualdecorator~ManualDecorator} instances and attaches proper converters
	 * that will work when linking an image.
	 */ _enableManualDecorators() {
        const editor = this.editor;
        const command = editor.commands.get('link');
        for (const decorator of command.manualDecorators){
            if (editor.plugins.has('ImageBlockEditing')) {
                editor.model.schema.extend('imageBlock', {
                    allowAttributes: decorator.id
                });
            }
            if (editor.plugins.has('ImageInlineEditing')) {
                editor.model.schema.extend('imageInline', {
                    allowAttributes: decorator.id
                });
            }
            editor.conversion.for('downcast').add(downcastImageLinkManualDecorator(decorator));
            editor.conversion.for('upcast').add(upcastImageLinkManualDecorator(editor, decorator));
        }
    }
}
/**
 * Returns a converter for linked block images that consumes the "href" attribute
 * if a link contains an image.
 *
 * @param editor The editor instance.
 */ function upcastLink(editor) {
    const isImageInlinePluginLoaded = editor.plugins.has('ImageInlineEditing');
    const imageUtils = editor.plugins.get('ImageUtils');
    return (dispatcher)=>{
        dispatcher.on('element:a', (evt, data, conversionApi)=>{
            const viewLink = data.viewItem;
            const imageInLink = imageUtils.findViewImgElement(viewLink);
            if (!imageInLink) {
                return;
            }
            const blockImageView = imageInLink.findAncestor((element)=>imageUtils.isBlockImageView(element));
            // There are four possible cases to consider here
            //
            // 1. A "root > ... > figure.image > a > img" structure.
            // 2. A "root > ... > figure.image > a > picture > img" structure.
            // 3. A "root > ... > block > a > img" structure.
            // 4. A "root > ... > block > a > picture > img" structure.
            //
            // but the last 2 cases should only be considered by this converter when the inline image plugin
            // is NOT loaded in the editor (because otherwise, that would be a plain, linked inline image).
            if (isImageInlinePluginLoaded && !blockImageView) {
                return;
            }
            // There's an image inside an <a> element - we consume it so it won't be picked up by the Link plugin.
            const consumableAttributes = {
                attributes: [
                    'href'
                ]
            };
            // Consume the `href` attribute so the default one will not convert it to $text attribute.
            if (!conversionApi.consumable.consume(viewLink, consumableAttributes)) {
                // Might be consumed by something else - i.e. other converter with priority=highest - a standard check.
                return;
            }
            const linkHref = viewLink.getAttribute('href');
            // Missing the 'href' attribute.
            if (!linkHref) {
                return;
            }
            // A full definition of the image feature.
            // figure > a > img: parent of the view link element is an image element (figure).
            let modelElement = data.modelCursor.parent;
            if (!modelElement.is('element', 'imageBlock')) {
                // a > img: parent of the view link is not the image (figure) element. We need to convert it manually.
                const conversionResult = conversionApi.convertItem(imageInLink, data.modelCursor);
                // Set image range as conversion result.
                data.modelRange = conversionResult.modelRange;
                // Continue conversion where image conversion ends.
                data.modelCursor = conversionResult.modelCursor;
                modelElement = data.modelCursor.nodeBefore;
            }
            if (modelElement && modelElement.is('element', 'imageBlock')) {
                // Set the linkHref attribute from link element on model image element.
                conversionApi.writer.setAttribute('linkHref', linkHref, modelElement);
            }
        }, {
            priority: 'high'
        });
    // Using the same priority that `upcastImageLinkManualDecorator()` converter guarantees
    // that manual decorators will decorate the proper element.
    };
}
/**
 * Creates a converter that adds `<a>` to linked block image view elements.
 */ function downcastImageLink(editor) {
    const imageUtils = editor.plugins.get('ImageUtils');
    return (dispatcher)=>{
        dispatcher.on('attribute:linkHref:imageBlock', (evt, data, conversionApi)=>{
            if (!conversionApi.consumable.consume(data.item, evt.name)) {
                return;
            }
            // The image will be already converted - so it will be present in the view.
            const viewFigure = conversionApi.mapper.toViewElement(data.item);
            const writer = conversionApi.writer;
            // But we need to check whether the link element exists.
            const linkInImage = Array.from(viewFigure.getChildren()).find((child)=>child.is('element', 'a'));
            const viewImage = imageUtils.findViewImgElement(viewFigure);
            // <picture>...<img/></picture> or <img/>
            const viewImgOrPicture = viewImage.parent.is('element', 'picture') ? viewImage.parent : viewImage;
            // If so, update the attribute if it's defined or remove the entire link if the attribute is empty.
            if (linkInImage) {
                if (data.attributeNewValue) {
                    writer.setAttribute('href', data.attributeNewValue, linkInImage);
                } else {
                    writer.move(writer.createRangeOn(viewImgOrPicture), writer.createPositionAt(viewFigure, 0));
                    writer.remove(linkInImage);
                }
            } else {
                // But if it does not exist. Let's wrap already converted image by newly created link element.
                // 1. Create an empty link element.
                const linkElement = writer.createContainerElement('a', {
                    href: data.attributeNewValue
                });
                // 2. Insert link inside the associated image.
                writer.insert(writer.createPositionAt(viewFigure, 0), linkElement);
                // 3. Move the image to the link.
                writer.move(writer.createRangeOn(viewImgOrPicture), writer.createPositionAt(linkElement, 0));
            }
        }, {
            priority: 'high'
        });
    };
}
/**
 * Returns a converter that decorates the `<a>` element when the image is the link label.
 */ function downcastImageLinkManualDecorator(decorator) {
    return (dispatcher)=>{
        dispatcher.on(`attribute:${decorator.id}:imageBlock`, (evt, data, conversionApi)=>{
            const viewFigure = conversionApi.mapper.toViewElement(data.item);
            const linkInImage = Array.from(viewFigure.getChildren()).find((child)=>child.is('element', 'a'));
            // The <a> element was removed by the time this converter is executed.
            // It may happen when the base `linkHref` and decorator attributes are removed
            // at the same time (see #8401).
            if (!linkInImage) {
                return;
            }
            for (const [key, val] of toMap(decorator.attributes)){
                conversionApi.writer.setAttribute(key, val, linkInImage);
            }
            if (decorator.classes) {
                conversionApi.writer.addClass(decorator.classes, linkInImage);
            }
            for(const key in decorator.styles){
                conversionApi.writer.setStyle(key, decorator.styles[key], linkInImage);
            }
        });
    };
}
/**
 * Returns a converter that checks whether manual decorators should be applied to the link.
 */ function upcastImageLinkManualDecorator(editor, decorator) {
    const isImageInlinePluginLoaded = editor.plugins.has('ImageInlineEditing');
    const imageUtils = editor.plugins.get('ImageUtils');
    return (dispatcher)=>{
        dispatcher.on('element:a', (evt, data, conversionApi)=>{
            const viewLink = data.viewItem;
            const imageInLink = imageUtils.findViewImgElement(viewLink);
            // We need to check whether an image is inside a link because the converter handles
            // only manual decorators for linked images. See #7975.
            if (!imageInLink) {
                return;
            }
            const blockImageView = imageInLink.findAncestor((element)=>imageUtils.isBlockImageView(element));
            if (isImageInlinePluginLoaded && !blockImageView) {
                return;
            }
            const matcher = new Matcher(decorator._createPattern());
            const result = matcher.match(viewLink);
            // The link element does not have required attributes or/and proper values.
            if (!result) {
                return;
            }
            // Check whether we can consume those attributes.
            if (!conversionApi.consumable.consume(viewLink, result.match)) {
                return;
            }
            // At this stage we can assume that we have the `<imageBlock>` element.
            // `nodeBefore` comes after conversion: `<a><img></a>`.
            // `parent` comes with full image definition: `<figure><a><img></a></figure>.
            // See the body of the `upcastLink()` function.
            const modelElement = data.modelCursor.nodeBefore || data.modelCursor.parent;
            conversionApi.writer.setAttribute(decorator.id, true, modelElement);
        }, {
            priority: 'high'
        });
    // Using the same priority that `upcastLink()` converter guarantees that the linked image was properly converted.
    };
}

/**
 * The link image UI plugin.
 *
 * This plugin provides the `'linkImage'` button that can be displayed in the {@link module:image/imagetoolbar~ImageToolbar}.
 * It can be used to wrap images in links.
 */ class LinkImageUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            LinkEditing,
            LinkUI,
            'ImageBlockEditing'
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'LinkImageUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const viewDocument = editor.editing.view.document;
        this.listenTo(viewDocument, 'click', (evt, data)=>{
            if (this._isSelectedLinkedImage(editor.model.document.selection)) {
                // Prevent browser navigation when clicking a linked image.
                data.preventDefault();
                // Block the `LinkUI` plugin when an image was clicked.
                // In such a case, we'd like to display the image toolbar.
                evt.stop();
            }
        }, {
            priority: 'high'
        });
        this._createToolbarLinkImageButton();
    }
    /**
	 * Creates a `LinkImageUI` button view.
	 *
	 * Clicking this button shows a {@link module:link/linkui~LinkUI#_balloon} attached to the selection.
	 * When an image is already linked, the view shows {@link module:link/linkui~LinkUI#actionsView} or
	 * {@link module:link/linkui~LinkUI#formView} if it is not.
	 */ _createToolbarLinkImageButton() {
        const editor = this.editor;
        const t = editor.t;
        editor.ui.componentFactory.add('linkImage', (locale)=>{
            const button = new ButtonView(locale);
            const plugin = editor.plugins.get('LinkUI');
            const linkCommand = editor.commands.get('link');
            button.set({
                isEnabled: true,
                label: t('Link image'),
                icon: linkIcon,
                keystroke: LINK_KEYSTROKE,
                tooltip: true,
                isToggleable: true
            });
            // Bind button to the command.
            button.bind('isEnabled').to(linkCommand, 'isEnabled');
            button.bind('isOn').to(linkCommand, 'value', (value)=>!!value);
            // Show the actionsView or formView (both from LinkUI) on button click depending on whether the image is linked already.
            this.listenTo(button, 'execute', ()=>{
                if (this._isSelectedLinkedImage(editor.model.document.selection)) {
                    plugin._addActionsView();
                } else {
                    plugin._showUI(true);
                }
            });
            return button;
        });
    }
    /**
	 * Returns true if a linked image (either block or inline) is the only selected element
	 * in the model document.
	 */ _isSelectedLinkedImage(selection) {
        const selectedModelElement = selection.getSelectedElement();
        const imageUtils = this.editor.plugins.get('ImageUtils');
        return imageUtils.isImage(selectedModelElement) && selectedModelElement.hasAttribute('linkHref');
    }
}

/**
 * The `LinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkimageediting~LinkImageEditing link image editing feature}
 * and {@link module:link/linkimageui~LinkImageUI link image UI feature}.
 */ class LinkImage extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            LinkImageEditing,
            LinkImageUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'LinkImage';
    }
}

export { AutoLink, Link, LinkCommand, LinkEditing, LinkImage, LinkImageEditing, LinkImageUI, LinkUI, UnlinkCommand };
//# sourceMappingURL=index.js.map
