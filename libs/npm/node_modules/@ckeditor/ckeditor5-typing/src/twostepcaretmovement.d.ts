/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module typing/twostepcaretmovement
 */
import { Plugin, type Editor } from '@ckeditor/ckeditor5-core';
/**
 * This plugin enables the two-step caret (phantom) movement behavior for
 * {@link module:typing/twostepcaretmovement~TwoStepCaretMovement#registerAttribute registered attributes}
 * on arrow right (<kbd>→</kbd>) and left (<kbd>←</kbd>) key press.
 *
 * Thanks to this (phantom) caret movement the user is able to type before/after as well as at the
 * beginning/end of an attribute.
 *
 * **Note:** This plugin support right–to–left (Arabic, Hebrew, etc.) content by mirroring its behavior
 * but for the sake of simplicity examples showcase only left–to–right use–cases.
 *
 * # Forward movement
 *
 * ## "Entering" an attribute:
 *
 * When this plugin is enabled and registered for the `a` attribute and the selection is right before it
 * (at the attribute boundary), pressing the right arrow key will not move the selection but update its
 * attributes accordingly:
 *
 * * When enabled:
 *
 * ```xml
 * foo{}<$text a="true">bar</$text>
 * ```
 *
 * 	<kbd>→</kbd>
 *
 * ```xml
 * foo<$text a="true">{}bar</$text>
 * ```
 *
 * * When disabled:
 *
 * ```xml
 * foo{}<$text a="true">bar</$text>
 * ```
 *
 * 	<kbd>→</kbd>
 *
 * ```xml
 * foo<$text a="true">b{}ar</$text>
 * ```
 *
 *
 * ## "Leaving" an attribute:
 *
 * * When enabled:
 *
 * ```xml
 * <$text a="true">bar{}</$text>baz
 * ```
 *
 * 	<kbd>→</kbd>
 *
 * ```xml
 * <$text a="true">bar</$text>{}baz
 * ```
 *
 * * When disabled:
 *
 * ```xml
 * <$text a="true">bar{}</$text>baz
 * ```
 *
 * 	<kbd>→</kbd>
 *
 * ```xml
 * <$text a="true">bar</$text>b{}az
 * ```
 *
 * # Backward movement
 *
 * * When enabled:
 *
 * ```xml
 * <$text a="true">bar</$text>{}baz
 * ```
 *
 * 	<kbd>←</kbd>
 *
 * ```xml
 * <$text a="true">bar{}</$text>baz
 * ```
 *
 * * When disabled:
 *
 * ```xml
 * <$text a="true">bar</$text>{}baz
 * ```
 *
 * 	<kbd>←</kbd>
 *
 * ```xml
 * <$text a="true">ba{}r</$text>b{}az
 * ```
 *
 * # Multiple attributes
 *
 * * When enabled and many attributes starts or ends at the same position:
 *
 * ```xml
 * <$text a="true" b="true">bar</$text>{}baz
 * ```
 *
 * 	<kbd>←</kbd>
 *
 * ```xml
 * <$text a="true" b="true">bar{}</$text>baz
 * ```
 *
 * * When enabled and one procedes another:
 *
 * ```xml
 * <$text a="true">bar</$text><$text b="true">{}bar</$text>
 * ```
 *
 * 	<kbd>←</kbd>
 *
 * ```xml
 * <$text a="true">bar{}</$text><$text b="true">bar</$text>
 * ```
 *
 */
export default class TwoStepCaretMovement extends Plugin {
    /**
     * A set of attributes to handle.
     */
    private attributes;
    /**
     * The current UID of the overridden gravity, as returned by
     * {@link module:engine/model/writer~Writer#overrideSelectionGravity}.
     */
    private _overrideUid;
    /**
     * A flag indicating that the automatic gravity restoration should not happen upon the next
     * gravity restoration.
     * {@link module:engine/model/selection~Selection#event:change:range} event.
     */
    private _isNextGravityRestorationSkipped;
    /**
     * @inheritDoc
     */
    static get pluginName(): "TwoStepCaretMovement";
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Registers a given attribute for the two-step caret movement.
     *
     * @param attribute Name of the attribute to handle.
     */
    registerAttribute(attribute: string): void;
    /**
     * Updates the document selection and the view according to the two–step caret movement state
     * when moving **forwards**. Executed upon `keypress` in the {@link module:engine/view/view~View}.
     *
     * @param data Data of the key press.
     * @returns `true` when the handler prevented caret movement.
     */
    private _handleForwardMovement;
    /**
     * Updates the document selection and the view according to the two–step caret movement state
     * when moving **backwards**. Executed upon `keypress` in the {@link module:engine/view/view~View}.
     *
     * @param data Data of the key press.
     * @returns `true` when the handler prevented caret movement
     */
    private _handleBackwardMovement;
    /**
     * Starts listening to {@link module:engine/view/document~Document#event:mousedown} and
     * {@link module:engine/view/document~Document#event:selectionChange} and puts the selection before/after a 2-step node
     * if clicked at the beginning/ending of the 2-step node.
     *
     * The purpose of this action is to allow typing around the 2-step node directly after a click.
     *
     * See https://github.com/ckeditor/ckeditor5/issues/1016.
     */
    private _enableClickingAfterNode;
    /**
     * Starts listening to {@link module:engine/model/model~Model#event:insertContent} and corrects the model
     * selection attributes if the selection is at the end of a two-step node after inserting the content.
     *
     * The purpose of this action is to improve the overall UX because the user is no longer "trapped" by the
     * two-step attribute of the selection, and they can type a "clean" (`linkHref`–less) text right away.
     *
     * See https://github.com/ckeditor/ckeditor5/issues/6053.
     */
    private _enableInsertContentSelectionAttributesFixer;
    /**
     * Starts listening to {@link module:engine/model/model~Model#deleteContent} and checks whether
     * removing a content right after the tow-step attribute.
     *
     * If so, the selection should not preserve the two-step attribute. However, if
     * the {@link module:typing/twostepcaretmovement~TwoStepCaretMovement} plugin is active and
     * the selection has the two-step attribute due to overridden gravity (at the end), the two-step attribute should stay untouched.
     *
     * The purpose of this action is to allow removing the link text and keep the selection outside the link.
     *
     * See https://github.com/ckeditor/ckeditor5/issues/7521.
     */
    private _handleDeleteContentAfterNode;
    /**
     * `true` when the gravity is overridden for the plugin.
     */
    private get _isGravityOverridden();
    /**
     * Overrides the gravity using the {@link module:engine/model/writer~Writer model writer}
     * and stores the information about this fact in the {@link #_overrideUid}.
     *
     * A shorthand for {@link module:engine/model/writer~Writer#overrideSelectionGravity}.
     */
    private _overrideGravity;
    /**
     * Restores the gravity using the {@link module:engine/model/writer~Writer model writer}.
     *
     * A shorthand for {@link module:engine/model/writer~Writer#restoreSelectionGravity}.
     */
    private _restoreGravity;
}
