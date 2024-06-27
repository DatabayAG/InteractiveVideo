/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/utils
 */
import type { DocumentSelection, DowncastWriter, Item, ViewElement, Writer } from 'ckeditor5/src/engine.js';
export interface GHSViewAttributes {
    attributes?: Record<string, unknown>;
    classes?: Array<string>;
    styles?: Record<string, string>;
}
/**
* Helper function for the downcast converter. Updates attributes on the given view element.
*
* @param writer The view writer.
* @param oldViewAttributes The previous GHS attribute value.
* @param newViewAttributes The current GHS attribute value.
* @param viewElement The view element to update.
*/
export declare function updateViewAttributes(writer: DowncastWriter, oldViewAttributes: GHSViewAttributes, newViewAttributes: GHSViewAttributes, viewElement: ViewElement): void;
/**
 * Helper function for the downcast converter. Sets attributes on the given view element.
 *
 * @param writer The view writer.
 * @param viewAttributes The GHS attribute value.
 * @param viewElement The view element to update.
 */
export declare function setViewAttributes(writer: DowncastWriter, viewAttributes: GHSViewAttributes, viewElement: ViewElement): void;
/**
 * Helper function for the downcast converter. Removes attributes on the given view element.
 *
 * @param writer The view writer.
 * @param viewAttributes The GHS attribute value.
 * @param viewElement The view element to update.
 */
export declare function removeViewAttributes(writer: DowncastWriter, viewAttributes: GHSViewAttributes, viewElement: ViewElement): void;
/**
* Merges view element attribute objects.
*/
export declare function mergeViewElementAttributes(target: GHSViewAttributes, source: GHSViewAttributes): GHSViewAttributes;
type ModifyGhsAttributesCallback = (t: Map<string, unknown>) => void;
type ModifyGhsClassesCallback = (t: Set<string>) => void;
type ModifyGhsStylesCallback = (t: Map<string, string>) => void;
/**
 * Updates a GHS attribute on a specified item.
 * @param callback That receives a map as an argument and should modify it (add or remove entries).
 */
export declare function modifyGhsAttribute(writer: Writer, item: Item | DocumentSelection, ghsAttributeName: string, subject: 'attributes', callback: ModifyGhsAttributesCallback): void;
/**
 * Updates a GHS attribute on a specified item.
 * @param callback That receives a set as an argument and should modify it (add or remove entries).
 */
export declare function modifyGhsAttribute(writer: Writer, item: Item | DocumentSelection, ghsAttributeName: string, subject: 'classes', callback: ModifyGhsClassesCallback): void;
/**
 * Updates a GHS attribute on a specified item.
 * @param callback That receives a map as an argument and should modify it (add or remove entries).
 */
export declare function modifyGhsAttribute(writer: Writer, item: Item | DocumentSelection, ghsAttributeName: string, subject: 'styles', callback: ModifyGhsStylesCallback): void;
/**
 * Transforms passed string to PascalCase format. Examples:
 * * `div` => `Div`
 * * `h1` => `H1`
 * * `table` => `Table`
 */
export declare function toPascalCase(data: string): string;
/**
 * Returns the attribute name of the model element that holds raw HTML attributes.
 */
export declare function getHtmlAttributeName(viewElementName: string): string;
export {};
