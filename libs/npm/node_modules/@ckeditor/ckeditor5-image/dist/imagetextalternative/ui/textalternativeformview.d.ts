/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/imagetextalternative/ui/textalternativeformview
 */
import { ButtonView, FocusCycler, LabeledFieldView, View, ViewCollection, type InputView, type FocusableView } from 'ckeditor5/src/ui.js';
import { FocusTracker, KeystrokeHandler, type Locale } from 'ckeditor5/src/utils.js';
import '../../../theme/textalternativeform.css';
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
/**
 * The TextAlternativeFormView class.
 */
export default class TextAlternativeFormView extends View {
    /**
     * Tracks information about the DOM focus in the form.
     */
    readonly focusTracker: FocusTracker;
    /**
     * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
     */
    readonly keystrokes: KeystrokeHandler;
    /**
     * An input with a label.
     */
    labeledInput: LabeledFieldView<InputView>;
    /**
     * A button used to submit the form.
     */
    saveButtonView: ButtonView;
    /**
     * A button used to cancel the form.
     */
    cancelButtonView: ButtonView;
    /**
     * A collection of views which can be focused in the form.
     */
    protected readonly _focusables: ViewCollection<FocusableView>;
    /**
     * Helps cycling over {@link #_focusables} in the form.
     */
    protected readonly _focusCycler: FocusCycler;
    /**
     * @inheritDoc
     */
    constructor(locale: Locale);
    /**
     * @inheritDoc
     */
    render(): void;
    /**
     * @inheritDoc
     */
    destroy(): void;
    /**
     * Creates the button view.
     *
     * @param label The button label
     * @param icon The button's icon.
     * @param className The additional button CSS class name.
     * @param eventName The event name that the ButtonView#execute event will be delegated to.
     * @returns The button view instance.
     */
    private _createButton;
    /**
     * Creates an input with a label.
     *
     * @returns Labeled field view instance.
     */
    private _createLabeledInputView;
}
/**
 * Fired when the form view is submitted.
 *
 * @eventName ~TextAlternativeFormView#submit
 */
export type TextAlternativeFormViewSubmitEvent = {
    name: 'submit';
    args: [];
};
/**
 * Fired when the form view is canceled.
 *
 * @eventName ~TextAlternativeFormView#cancel
 */
export type TextAlternativeFormViewCancelEvent = {
    name: 'cancel';
    args: [];
};
