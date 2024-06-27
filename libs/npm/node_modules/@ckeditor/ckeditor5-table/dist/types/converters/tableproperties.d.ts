/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/converters/tableproperties
 */
import type { Conversion, ViewElement } from 'ckeditor5/src/engine.js';
/**
 * Conversion helper for upcasting attributes using normalized styles.
 *
 * @param options.modelAttribute The attribute to set.
 * @param options.styleName The style name to convert.
 * @param options.viewElement The view element name that should be converted.
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 * @param options.shouldUpcast The function which returns `true` if style should be upcasted from this element.
 */
export declare function upcastStyleToAttribute(conversion: Conversion, options: {
    modelAttribute: string;
    styleName: string;
    viewElement: string | RegExp;
    defaultValue: string;
    reduceBoxSides?: boolean;
    shouldUpcast?: (viewElement: ViewElement) => boolean;
}): void;
export interface StyleValues {
    color: string;
    style: string;
    width: string;
}
/**
 * Conversion helper for upcasting border styles for view elements.
 *
 * @param defaultBorder The default border values.
 * @param defaultBorder.color The default `borderColor` value.
 * @param defaultBorder.style The default `borderStyle` value.
 * @param defaultBorder.width The default `borderWidth` value.
 */
export declare function upcastBorderStyles(conversion: Conversion, viewElementName: string, modelAttributes: StyleValues, defaultBorder: StyleValues): void;
/**
 * Conversion helper for downcasting an attribute to a style.
 */
export declare function downcastAttributeToStyle(conversion: Conversion, options: {
    modelElement: string;
    modelAttribute: string;
    styleName: string;
}): void;
/**
 * Conversion helper for downcasting attributes from the model table to a view table (not to `<figure>`).
 */
export declare function downcastTableAttribute(conversion: Conversion, options: {
    modelAttribute: string;
    styleName: string;
}): void;
