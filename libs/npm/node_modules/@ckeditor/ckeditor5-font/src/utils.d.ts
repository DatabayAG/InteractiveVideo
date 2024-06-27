/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module font/utils
 */
import type { FontFamilyOption, FontSizeOption } from './fontconfig.js';
import { ColorSelectorView, type ColorDefinition, type ColorPickerViewConfig, type DropdownView } from 'ckeditor5/src/ui.js';
import type { ArrayOrItem } from 'ckeditor5/src/utils.js';
import type { ViewAttributeElement, ViewElement, MatcherPattern, ViewElementDefinition, DowncastConversionApi } from 'ckeditor5/src/engine.js';
/**
 * The name of the font size plugin.
 */
export declare const FONT_SIZE = "fontSize";
/**
 * The name of the font family plugin.
 */
export declare const FONT_FAMILY = "fontFamily";
/**
 * The name of the font color plugin.
 */
export declare const FONT_COLOR = "fontColor";
/**
 * The name of the font background color plugin.
 */
export declare const FONT_BACKGROUND_COLOR = "fontBackgroundColor";
/**
 * Builds a proper converter definition out of input data.
 */
export declare function buildDefinition(modelAttributeKey: string, options: Array<FontFamilyOption> | Array<FontSizeOption>): FontConverterDefinition;
export type FontConverterDefinition = {
    model: {
        key: string;
        values: Array<string>;
    };
    view: Record<string, ViewElementDefinition>;
    upcastAlso: Record<string, ArrayOrItem<MatcherPattern>>;
};
/**
 * A {@link module:font/fontcolor~FontColor font color} and
 * {@link module:font/fontbackgroundcolor~FontBackgroundColor font background color} helper
 * responsible for upcasting data to the model.
 *
 * **Note**: The `styleAttr` parameter should be either `'color'` or `'background-color'`.
 */
export declare function renderUpcastAttribute(styleAttr: string): (viewElement: ViewElement) => string;
/**
 * A {@link module:font/fontcolor~FontColor font color} and
 * {@link module:font/fontbackgroundcolor~FontBackgroundColor font background color} helper
 * responsible for downcasting a color attribute to a `<span>` element.
 *
 * **Note**: The `styleAttr` parameter should be either `'color'` or `'background-color'`.
 */
export declare function renderDowncastElement(styleAttr: string): (modelAttributeValue: string, { writer }: DowncastConversionApi) => ViewAttributeElement;
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
export declare function addColorSelectorToDropdown({ dropdownView, colors, columns, removeButtonLabel, colorPickerLabel, documentColorsLabel, documentColorsCount, colorPickerViewConfig }: {
    dropdownView: ColorSelectorDropdownView;
    colors: Array<ColorDefinition>;
    columns: number;
    removeButtonLabel: string;
    colorPickerLabel: string;
    documentColorsLabel?: string;
    documentColorsCount?: number;
    colorPickerViewConfig: ColorPickerViewConfig | false;
}): ColorSelectorView;
export type ColorSelectorDropdownView = DropdownView & {
    colorSelectorView?: ColorSelectorView;
};
