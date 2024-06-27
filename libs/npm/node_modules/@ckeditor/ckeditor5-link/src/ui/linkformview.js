/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module link/ui/linkformview
 */
import { ButtonView, FocusCycler, LabeledFieldView, SwitchButtonView, View, ViewCollection, createLabeledInputText, submitHandler } from 'ckeditor5/src/ui.js';
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils.js';
import { icons } from 'ckeditor5/src/core.js';
// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '../../theme/linkform.css';
/**
 * The link form view controller class.
 *
 * See {@link module:link/ui/linkformview~LinkFormView}.
 */
export default class LinkFormView extends View {
    /**
     * Creates an instance of the {@link module:link/ui/linkformview~LinkFormView} class.
     *
     * Also see {@link #render}.
     *
     * @param locale The localization services instance.
     * @param linkCommand Reference to {@link module:link/linkcommand~LinkCommand}.
     * @param validators  Form validators used by {@link #isValid}.
     */
    constructor(locale, linkCommand, validators) {
        super(locale);
        /**
         * Tracks information about DOM focus in the form.
         */
        this.focusTracker = new FocusTracker();
        /**
         * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
         */
        this.keystrokes = new KeystrokeHandler();
        /**
         * A collection of views that can be focused in the form.
         */
        this._focusables = new ViewCollection();
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
        const classList = ['ck', 'ck-link-form', 'ck-responsive-form'];
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
     */
    getDecoratorSwitchesState() {
        return Array
            .from(this._manualDecoratorSwitches)
            .reduce((accumulator, switchButton) => {
            accumulator[switchButton.name] = switchButton.isOn;
            return accumulator;
        }, {});
    }
    /**
     * @inheritDoc
     */
    render() {
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
        childViews.forEach(v => {
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
     */
    destroy() {
        super.destroy();
        this.focusTracker.destroy();
        this.keystrokes.destroy();
    }
    /**
     * Focuses the fist {@link #_focusables} in the form.
     */
    focus() {
        this._focusCycler.focusFirst();
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
     */
    resetFormStatus() {
        this.urlInputView.errorText = null;
    }
    /**
     * Creates a labeled input view.
     *
     * @returns Labeled field view instance.
     */
    _createUrlInput() {
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
     * Populates {@link module:ui/viewcollection~ViewCollection} of {@link module:ui/button/switchbuttonview~SwitchButtonView}
     * made based on {@link module:link/linkcommand~LinkCommand#manualDecorators}.
     *
     * @param linkCommand A reference to the link command.
     * @returns ViewCollection of switch buttons.
     */
    _createManualDecoratorSwitches(linkCommand) {
        const switches = this.createCollection();
        for (const manualDecorator of linkCommand.manualDecorators) {
            const switchButton = new SwitchButtonView(this.locale);
            switchButton.set({
                name: manualDecorator.id,
                label: manualDecorator.label,
                withText: true
            });
            switchButton.bind('isOn').toMany([manualDecorator, linkCommand], 'value', (decoratorValue, commandValue) => {
                return commandValue === undefined && decoratorValue === undefined ? !!manualDecorator.defaultValue : !!decoratorValue;
            });
            switchButton.on('execute', () => {
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
     */
    _createFormChildren(manualDecorators) {
        const children = this.createCollection();
        children.add(this.urlInputView);
        if (manualDecorators.length) {
            const additionalButtonsView = new View();
            additionalButtonsView.setTemplate({
                tag: 'ul',
                children: this._manualDecoratorSwitches.map(switchButton => ({
                    tag: 'li',
                    children: [switchButton],
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
     */
    get url() {
        const { element } = this.urlInputView.fieldView;
        if (!element) {
            return null;
        }
        return element.value.trim();
    }
}
