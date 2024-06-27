/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { ColorSelectorView } from 'ckeditor5/src/ui.js';
/**
 * The name of the font size plugin.
 */
export const FONT_SIZE = 'fontSize';
/**
 * The name of the font family plugin.
 */
export const FONT_FAMILY = 'fontFamily';
/**
 * The name of the font color plugin.
 */
export const FONT_COLOR = 'fontColor';
/**
 * The name of the font background color plugin.
 */
export const FONT_BACKGROUND_COLOR = 'fontBackgroundColor';
/**
 * Builds a proper converter definition out of input data.
 */
export function buildDefinition(modelAttributeKey, options) {
    const definition = {
        model: {
            key: modelAttributeKey,
            values: []
        },
        view: {},
        upcastAlso: {}
    };
    for (const option of options) {
        definition.model.values.push(option.model);
        definition.view[option.model] = option.view;
        if (option.upcastAlso) {
            definition.upcastAlso[option.model] = option.upcastAlso;
        }
    }
    return definition;
}
/**
 * A {@link module:font/fontcolor~FontColor font color} and
 * {@link module:font/fontbackgroundcolor~FontBackgroundColor font background color} helper
 * responsible for upcasting data to the model.
 *
 * **Note**: The `styleAttr` parameter should be either `'color'` or `'background-color'`.
 */
export function renderUpcastAttribute(styleAttr) {
    return (viewElement) => normalizeColorCode(viewElement.getStyle(styleAttr));
}
/**
 * A {@link module:font/fontcolor~FontColor font color} and
 * {@link module:font/fontbackgroundcolor~FontBackgroundColor font background color} helper
 * responsible for downcasting a color attribute to a `<span>` element.
 *
 * **Note**: The `styleAttr` parameter should be either `'color'` or `'background-color'`.
 */
export function renderDowncastElement(styleAttr) {
    return (modelAttributeValue, { writer }) => writer.createAttributeElement('span', {
        style: `${styleAttr}:${modelAttributeValue}`
    }, { priority: 7 });
}
/**
 * A helper that adds {@link module:ui/colorselector/colorselectorview~ColorSelectorView} to the color dropdown with proper initial values.
 *
 * @param config.dropdownView The dropdown view to which a {@link module:ui/colorselector/colorselectorview~ColorSelectorView}
 * will be added.
 * @param config.colors An array with definitions representing colors to be displayed in the color selector.
 * @param config.removeButtonLabel The label for the button responsible for removing the color.
 * @param config.documentColorsLabel The label for the section with document colors.
 * @param config.documentColorsCount The number of document colors inside the dropdown.
 * @param config.colorPickerViewConfig Configuration of the color picker view.
 * @returns The new color selector view.
 */
export function addColorSelectorToDropdown({ dropdownView, colors, columns, removeButtonLabel, colorPickerLabel, documentColorsLabel, documentColorsCount, colorPickerViewConfig }) {
    const locale = dropdownView.locale;
    const colorSelectorView = new ColorSelectorView(locale, {
        colors,
        columns,
        removeButtonLabel,
        colorPickerLabel,
        documentColorsLabel,
        documentColorsCount,
        colorPickerViewConfig
    });
    dropdownView.colorSelectorView = colorSelectorView;
    dropdownView.panelView.children.add(colorSelectorView);
    return colorSelectorView;
}
/**
 * Fixes the color value string.
 */
function normalizeColorCode(value) {
    return value.replace(/\s/g, '');
}
