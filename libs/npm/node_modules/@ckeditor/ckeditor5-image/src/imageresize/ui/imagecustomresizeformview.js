/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/imageresize/ui/imagecustomresizeformview
 */
import { ButtonView, FocusCycler, LabeledFieldView, View, ViewCollection, createLabeledInputNumber, submitHandler } from 'ckeditor5/src/ui.js';
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils.js';
import { icons } from 'ckeditor5/src/core.js';
import '../../../theme/imagecustomresizeform.css';
// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
/**
 * The ImageCustomResizeFormView class.
 */
export default class ImageCustomResizeFormView extends View {
    /**
     * @inheritDoc
     */
    constructor(locale, unit, validators) {
        super(locale);
        const t = this.locale.t;
        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this.unit = unit;
        this.labeledInput = this._createLabeledInputView();
        this.saveButtonView = this._createButton(t('Save'), icons.check, 'ck-button-save');
        this.saveButtonView.type = 'submit';
        this.cancelButtonView = this._createButton(t('Cancel'), icons.cancel, 'ck-button-cancel', 'cancel');
        this._focusables = new ViewCollection();
        this._validators = validators;
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
            tag: 'form',
            attributes: {
                class: [
                    'ck',
                    'ck-image-custom-resize-form',
                    'ck-responsive-form'
                ],
                // https://github.com/ckeditor/ckeditor5-image/issues/40
                tabindex: '-1'
            },
            children: [
                this.labeledInput,
                this.saveButtonView,
                this.cancelButtonView
            ]
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        this.keystrokes.listenTo(this.element);
        submitHandler({ view: this });
        [this.labeledInput, this.saveButtonView, this.cancelButtonView]
            .forEach(v => {
            // Register the view as focusable.
            this._focusables.add(v);
            // Register the view in the focus tracker.
            this.focusTracker.add(v.element);
        });
    }
    /**
     * @inheritDoc
     */
    destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
    /**
     * Creates the button view.
     *
     * @param label The button label
     * @param icon The button's icon.
     * @param className The additional button CSS class name.
     * @param eventName The event name that the ButtonView#execute event will be delegated to.
     * @returns The button view instance.
     */
    _createButton(label, icon, className, eventName) {
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
     * Creates an input with a label.
     *
     * @returns Labeled field view instance.
     */
    _createLabeledInputView() {
        const t = this.locale.t;
        const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);
        labeledInput.label = t('Resize image (in %0)', this.unit);
        labeledInput.fieldView.set({
            step: 0.1
        });
        return labeledInput;
    }
    /**
     * Validates the form and returns `false` when some fields are invalid.
     */
    isValid() {
        this.resetFormStatus();
        for (const validator of this._validators) {
            const errorText = validator(this);
            // One error per field is enough.
            if (errorText) {
                // Apply updated error.
                this.labeledInput.errorText = errorText;
                return false;
            }
        }
        return true;
    }
    /**
     * Cleans up the supplementary error and information text of the {@link #labeledInput}
     * bringing them back to the state when the form has been displayed for the first time.
     *
     * See {@link #isValid}.
     */
    resetFormStatus() {
        this.labeledInput.errorText = null;
    }
    /**
     * The native DOM `value` of the input element of {@link #labeledInput}.
     */
    get rawSize() {
        const { element } = this.labeledInput.fieldView;
        if (!element) {
            return null;
        }
        return element.value;
    }
    /**
     * Get numeric value of size. Returns `null` if value of size input element in {@link #labeledInput}.is not a number.
     */
    get parsedSize() {
        const { rawSize } = this;
        if (rawSize === null) {
            return null;
        }
        const parsed = Number.parseFloat(rawSize);
        if (Number.isNaN(parsed)) {
            return null;
        }
        return parsed;
    }
    /**
     * Returns serialized image input size with unit.
     * Returns `null` if value of size input element in {@link #labeledInput}.is not a number.
     */
    get sizeWithUnits() {
        const { parsedSize, unit } = this;
        if (parsedSize === null) {
            return null;
        }
        return `${parsedSize}${unit}`;
    }
}
