/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module link/linkediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { Input, TwoStepCaretMovement, inlineHighlight } from 'ckeditor5/src/typing.js';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard.js';
import { keyCodes, env } from 'ckeditor5/src/utils.js';
import LinkCommand from './linkcommand.js';
import UnlinkCommand from './unlinkcommand.js';
import ManualDecorator from './utils/manualdecorator.js';
import { createLinkElement, ensureSafeUrl, getLocalizedDecorators, normalizeDecorators, openLink, addLinkProtocolIfApplicable } from './utils.js';
import '../theme/link.css';
const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;
/**
 * The link engine feature.
 *
 * It introduces the `linkHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'link'` and `'unlink'` commands.
 */
export default class LinkEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'LinkEditing';
    }
    /**
     * @inheritDoc
     */
    static get requires() {
        // Clipboard is required for handling cut and paste events while typing over the link.
        return [TwoStepCaretMovement, Input, ClipboardPipeline];
    }
    /**
     * @inheritDoc
     */
    constructor(editor) {
        super(editor);
        editor.config.define('link', {
            allowCreatingEmptyLinks: false,
            addTargetToExternalLinks: false
        });
    }
    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        const allowedProtocols = this.editor.config.get('link.allowedProtocols');
        // Allow link attribute on all inline nodes.
        editor.model.schema.extend('$text', { allowAttributes: 'linkHref' });
        editor.conversion.for('dataDowncast')
            .attributeToElement({ model: 'linkHref', view: createLinkElement });
        editor.conversion.for('editingDowncast')
            .attributeToElement({ model: 'linkHref', view: (href, conversionApi) => {
                return createLinkElement(ensureSafeUrl(href, allowedProtocols), conversionApi);
            } });
        editor.conversion.for('upcast')
            .elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    href: true
                }
            },
            model: {
                key: 'linkHref',
                value: (viewElement) => viewElement.getAttribute('href')
            }
        });
        // Create linking commands.
        editor.commands.add('link', new LinkCommand(editor));
        editor.commands.add('unlink', new UnlinkCommand(editor));
        const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(editor.config.get('link.decorators')));
        this._enableAutomaticDecorators(linkDecorators
            .filter((item) => item.mode === DECORATOR_AUTOMATIC));
        this._enableManualDecorators(linkDecorators
            .filter((item) => item.mode === DECORATOR_MANUAL));
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
     */
    _enableAutomaticDecorators(automaticDecoratorDefinitions) {
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
                callback: url => !!url && EXTERNAL_LINKS_REGEXP.test(url),
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
     */
    _enableManualDecorators(manualDecoratorDefinitions) {
        if (!manualDecoratorDefinitions.length) {
            return;
        }
        const editor = this.editor;
        const command = editor.commands.get('link');
        const manualDecorators = command.manualDecorators;
        manualDecoratorDefinitions.forEach(decoratorDefinition => {
            editor.model.schema.extend('$text', { allowAttributes: decoratorDefinition.id });
            // Keeps reference to manual decorator to decode its name to attributes during downcast.
            const decorator = new ManualDecorator(decoratorDefinition);
            manualDecorators.add(decorator);
            editor.conversion.for('downcast').attributeToElement({
                model: decorator.id,
                view: (manualDecoratorValue, { writer, schema }, { item }) => {
                    // Manual decorators for block links are handled e.g. in LinkImageEditing.
                    if (!(item.is('selection') || schema.isInline(item))) {
                        return;
                    }
                    if (manualDecoratorValue) {
                        const element = writer.createAttributeElement('a', decorator.attributes, { priority: 5 });
                        if (decorator.classes) {
                            writer.addClass(decorator.classes, element);
                        }
                        for (const key in decorator.styles) {
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
     */
    _enableLinkOpen() {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;
        this.listenTo(viewDocument, 'click', (evt, data) => {
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
        }, { context: '$capture' });
        // Open link on Alt+Enter.
        this.listenTo(viewDocument, 'keydown', (evt, data) => {
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
     */
    _enableSelectionAttributesFixer() {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;
        this.listenTo(selection, 'change:attribute', (evt, { attributeKeys }) => {
            if (!attributeKeys.includes('linkHref') || selection.hasAttribute('linkHref')) {
                return;
            }
            model.change(writer => {
                removeLinkAttributesFromSelection(writer, getLinkAttributesAllowedOnText(model.schema));
            });
        });
    }
    /**
     * Enables URL fixing on pasting.
     */
    _enableClipboardIntegration() {
        const editor = this.editor;
        const model = editor.model;
        const defaultProtocol = this.editor.config.get('link.defaultProtocol');
        if (!defaultProtocol) {
            return;
        }
        this.listenTo(editor.plugins.get('ClipboardPipeline'), 'contentInsertion', (evt, data) => {
            model.change(writer => {
                const range = writer.createRangeIn(data.content);
                for (const item of range.getItems()) {
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
 */
function removeLinkAttributesFromSelection(writer, linkAttributes) {
    writer.removeSelectionAttribute('linkHref');
    for (const attribute of linkAttributes) {
        writer.removeSelectionAttribute(attribute);
    }
}
/**
 * Returns an array containing names of the attributes allowed on `$text` that describes the link item.
 */
function getLinkAttributesAllowedOnText(schema) {
    const textAttributes = schema.getDefinition('$text').allowAttributes;
    return textAttributes.filter(attribute => attribute.startsWith('link'));
}
