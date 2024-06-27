/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module link/linkediting
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { Input, TwoStepCaretMovement } from 'ckeditor5/src/typing.js';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard.js';
import '../theme/link.css';
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
    static get pluginName(): "LinkEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TwoStepCaretMovement, typeof Input, typeof ClipboardPipeline];
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators}
     * and registers a {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher downcast dispatcher}
     * for each one of them. Downcast dispatchers are obtained using the
     * {@link module:link/utils/automaticdecorators~AutomaticDecorators#getDispatcher} method.
     *
     * **Note**: This method also activates the automatic external link decorator if enabled with
     * {@link module:link/linkconfig~LinkConfig#addTargetToExternalLinks `config.link.addTargetToExternalLinks`}.
     */
    private _enableAutomaticDecorators;
    /**
     * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorManualDefinition manual decorators},
     * transforms them into {@link module:link/utils/manualdecorator~ManualDecorator} instances and stores them in the
     * {@link module:link/linkcommand~LinkCommand#manualDecorators} collection (a model for manual decorators state).
     *
     * Also registers an {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement attribute-to-element}
     * converter for each manual decorator and extends the {@link module:engine/model/schema~Schema model's schema}
     * with adequate model attributes.
     */
    private _enableManualDecorators;
    /**
     * Attaches handlers for {@link module:engine/view/document~Document#event:enter} and
     * {@link module:engine/view/document~Document#event:click} to enable link following.
     */
    private _enableLinkOpen;
    /**
     * Watches the DocumentSelection attribute changes and removes link decorator attributes when the linkHref attribute is removed.
     *
     * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
     */
    private _enableSelectionAttributesFixer;
    /**
     * Enables URL fixing on pasting.
     */
    private _enableClipboardIntegration;
}
