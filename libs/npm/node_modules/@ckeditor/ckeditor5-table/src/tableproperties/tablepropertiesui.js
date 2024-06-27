/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tableproperties/tablepropertiesui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView, ContextualBalloon, clickOutsideHandler, getLocalizedColorOptions, normalizeColorOptions } from 'ckeditor5/src/ui.js';
import { debounce } from 'lodash-es';
import TablePropertiesView from './ui/tablepropertiesview.js';
import tableProperties from './../../theme/icons/table-properties.svg';
import { colorFieldValidator, getLocalizedColorErrorText, getLocalizedLengthErrorText, lengthFieldValidator, lineWidthFieldValidator, defaultColors } from '../utils/ui/table-properties.js';
import { getSelectionAffectedTableWidget } from '../utils/ui/widget.js';
import { getBalloonTablePositionData, repositionContextualBalloon } from '../utils/ui/contextualballoon.js';
import { getNormalizedDefaultProperties } from '../utils/table-properties.js';
const ERROR_TEXT_TIMEOUT = 500;
// Map of view properties and related commands.
const propertyToCommandMap = {
    borderStyle: 'tableBorderStyle',
    borderColor: 'tableBorderColor',
    borderWidth: 'tableBorderWidth',
    backgroundColor: 'tableBackgroundColor',
    width: 'tableWidth',
    height: 'tableHeight',
    alignment: 'tableAlignment'
};
/**
 * The table properties UI plugin. It introduces the `'tableProperties'` button
 * that opens a form allowing to specify visual styling of an entire table.
 *
 * It uses the {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon plugin}.
 */
export default class TablePropertiesUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires() {
        return [ContextualBalloon];
    }
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'TablePropertiesUI';
    }
    /**
     * @inheritDoc
     */
    constructor(editor) {
        super(editor);
        /**
         * The properties form view displayed inside the balloon.
         */
        this.view = null;
        editor.config.define('table.tableProperties', {
            borderColors: defaultColors,
            backgroundColors: defaultColors
        });
    }
    /**
     * @inheritDoc
     */
    init() {
        const editor = this.editor;
        const t = editor.t;
        this._defaultTableProperties = getNormalizedDefaultProperties(editor.config.get('table.tableProperties.defaultProperties'), {
            includeAlignmentProperty: true
        });
        this._balloon = editor.plugins.get(ContextualBalloon);
        editor.ui.componentFactory.add('tableProperties', locale => {
            const view = new ButtonView(locale);
            view.set({
                label: t('Table properties'),
                icon: tableProperties,
                tooltip: true
            });
            this.listenTo(view, 'execute', () => this._showView());
            const commands = Object.values(propertyToCommandMap)
                .map(commandName => editor.commands.get(commandName));
            view.bind('isEnabled').toMany(commands, 'isEnabled', (...areEnabled) => (areEnabled.some(isCommandEnabled => isCommandEnabled)));
            return view;
        });
    }
    /**
     * @inheritDoc
     */
    destroy() {
        super.destroy();
        // Destroy created UI components as they are not automatically destroyed.
        // See https://github.com/ckeditor/ckeditor5/issues/1341.
        if (this.view) {
            this.view.destroy();
        }
    }
    /**
     * Creates the {@link module:table/tableproperties/ui/tablepropertiesview~TablePropertiesView} instance.
     *
     * @returns The table properties form view instance.
     */
    _createPropertiesView() {
        const editor = this.editor;
        const config = editor.config.get('table.tableProperties');
        const borderColorsConfig = normalizeColorOptions(config.borderColors);
        const localizedBorderColors = getLocalizedColorOptions(editor.locale, borderColorsConfig);
        const backgroundColorsConfig = normalizeColorOptions(config.backgroundColors);
        const localizedBackgroundColors = getLocalizedColorOptions(editor.locale, backgroundColorsConfig);
        const hasColorPicker = config.colorPicker !== false;
        const view = new TablePropertiesView(editor.locale, {
            borderColors: localizedBorderColors,
            backgroundColors: localizedBackgroundColors,
            defaultTableProperties: this._defaultTableProperties,
            colorPickerConfig: hasColorPicker ? (config.colorPicker || {}) : false
        });
        const t = editor.t;
        // Render the view so its #element is available for the clickOutsideHandler.
        view.render();
        this.listenTo(view, 'submit', () => {
            this._hideView();
        });
        this.listenTo(view, 'cancel', () => {
            // https://github.com/ckeditor/ckeditor5/issues/6180
            if (this._undoStepBatch.operations.length) {
                editor.execute('undo', this._undoStepBatch);
            }
            this._hideView();
        });
        // Close the balloon on Esc key press.
        view.keystrokes.set('Esc', (data, cancel) => {
            this._hideView();
            cancel();
        });
        // Close on click outside of balloon panel element.
        clickOutsideHandler({
            emitter: view,
            activator: () => this._isViewInBalloon,
            contextElements: [this._balloon.view.element],
            callback: () => this._hideView()
        });
        const colorErrorText = getLocalizedColorErrorText(t);
        const lengthErrorText = getLocalizedLengthErrorText(t);
        // Create the "UI -> editor data" binding.
        // These listeners update the editor data (via table commands) when any observable
        // property of the view has changed. They also validate the value and display errors in the UI
        // when necessary. This makes the view live, which means the changes are
        // visible in the editing as soon as the user types or changes fields' values.
        view.on('change:borderStyle', this._getPropertyChangeCallback('tableBorderStyle'));
        view.on('change:borderColor', this._getValidatedPropertyChangeCallback({
            viewField: view.borderColorInput,
            commandName: 'tableBorderColor',
            errorText: colorErrorText,
            validator: colorFieldValidator
        }));
        view.on('change:borderWidth', this._getValidatedPropertyChangeCallback({
            viewField: view.borderWidthInput,
            commandName: 'tableBorderWidth',
            errorText: lengthErrorText,
            validator: lineWidthFieldValidator
        }));
        view.on('change:backgroundColor', this._getValidatedPropertyChangeCallback({
            viewField: view.backgroundInput,
            commandName: 'tableBackgroundColor',
            errorText: colorErrorText,
            validator: colorFieldValidator
        }));
        view.on('change:width', this._getValidatedPropertyChangeCallback({
            viewField: view.widthInput,
            commandName: 'tableWidth',
            errorText: lengthErrorText,
            validator: lengthFieldValidator
        }));
        view.on('change:height', this._getValidatedPropertyChangeCallback({
            viewField: view.heightInput,
            commandName: 'tableHeight',
            errorText: lengthErrorText,
            validator: lengthFieldValidator
        }));
        view.on('change:alignment', this._getPropertyChangeCallback('tableAlignment'));
        return view;
    }
    /**
     * In this method the "editor data -> UI" binding is happening.
     *
     * When executed, this method obtains selected table property values from various table commands
     * and passes them to the {@link #view}.
     *
     * This way, the UI stays up–to–date with the editor data.
     */
    _fillViewFormFromCommandValues() {
        const commands = this.editor.commands;
        const borderStyleCommand = commands.get('tableBorderStyle');
        Object.entries(propertyToCommandMap)
            .map(([property, commandName]) => {
            const propertyKey = property;
            const defaultValue = this._defaultTableProperties[propertyKey] || '';
            return [propertyKey, (commands.get(commandName).value || defaultValue)];
        })
            .forEach(([property, value]) => {
            // Do not set the `border-color` and `border-width` fields if `border-style:none`.
            if ((property === 'borderColor' || property === 'borderWidth') && borderStyleCommand.value === 'none') {
                return;
            }
            this.view.set(property, value);
        });
        this._isReady = true;
    }
    /**
     * Shows the {@link #view} in the {@link #_balloon}.
     *
     * **Note**: Each time a view is shown, the new {@link #_undoStepBatch} is created that contains
     * all changes made to the document when the view is visible, allowing a single undo step
     * for all of them.
     */
    _showView() {
        const editor = this.editor;
        if (!this.view) {
            this.view = this._createPropertiesView();
        }
        this.listenTo(editor.ui, 'update', () => {
            this._updateView();
        });
        // Update the view with the model values.
        this._fillViewFormFromCommandValues();
        this._balloon.add({
            view: this.view,
            position: getBalloonTablePositionData(editor)
        });
        // Create a new batch. Clicking "Cancel" will undo this batch.
        this._undoStepBatch = editor.model.createBatch();
        // Basic a11y.
        this.view.focus();
    }
    /**
     * Removes the {@link #view} from the {@link #_balloon}.
     */
    _hideView() {
        const editor = this.editor;
        this.stopListening(editor.ui, 'update');
        this._isReady = false;
        // Blur any input element before removing it from DOM to prevent issues in some browsers.
        // See https://github.com/ckeditor/ckeditor5/issues/1501.
        this.view.saveButtonView.focus();
        this._balloon.remove(this.view);
        // Make sure the focus is not lost in the process by putting it directly
        // into the editing view.
        this.editor.editing.view.focus();
    }
    /**
     * Repositions the {@link #_balloon} or hides the {@link #view} if a table is no longer selected.
     */
    _updateView() {
        const editor = this.editor;
        const viewDocument = editor.editing.view.document;
        if (!getSelectionAffectedTableWidget(viewDocument.selection)) {
            this._hideView();
        }
        else if (this._isViewVisible) {
            repositionContextualBalloon(editor, 'table');
        }
    }
    /**
     * Returns `true` when the {@link #view} is the visible in the {@link #_balloon}.
     */
    get _isViewVisible() {
        return !!this.view && this._balloon.visibleView === this.view;
    }
    /**
     * Returns `true` when the {@link #view} is in the {@link #_balloon}.
     */
    get _isViewInBalloon() {
        return !!this.view && this._balloon.hasView(this.view);
    }
    /**
     * Creates a callback that when executed upon {@link #view view's} property change
     * executes a related editor command with the new property value.
     *
     * If new value will be set to the default value, the command will not be executed.
     *
     * @param commandName The command that will be executed.
     */
    _getPropertyChangeCallback(commandName) {
        return (evt, propertyName, newValue) => {
            // Do not execute the command on initial call (opening the table properties view).
            if (!this._isReady) {
                return;
            }
            this.editor.execute(commandName, {
                value: newValue,
                batch: this._undoStepBatch
            });
        };
    }
    /**
     * Creates a callback that when executed upon {@link #view view's} property change:
     * * executes a related editor command with the new property value if the value is valid,
     * * or sets the error text next to the invalid field, if the value did not pass the validation.
     */
    _getValidatedPropertyChangeCallback(options) {
        const { commandName, viewField, validator, errorText } = options;
        const setErrorTextDebounced = debounce(() => {
            viewField.errorText = errorText;
        }, ERROR_TEXT_TIMEOUT);
        return (evt, propertyName, newValue) => {
            setErrorTextDebounced.cancel();
            // Do not execute the command on initial call (opening the table properties view).
            if (!this._isReady) {
                return;
            }
            if (validator(newValue)) {
                this.editor.execute(commandName, {
                    value: newValue,
                    batch: this._undoStepBatch
                });
                viewField.errorText = null;
            }
            else {
                setErrorTextDebounced();
            }
        };
    }
}
