/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/converters
 */
import type { Editor } from 'ckeditor5/src/core.js';
import type { AttributeElement, DowncastConversionApi, DowncastDispatcher, DowncastWriter, Element, ElementCreatorFunction, UpcastConversionApi, UpcastDispatcher, ViewElement } from 'ckeditor5/src/engine.js';
import type DataFilter from './datafilter.js';
import type { DataSchemaBlockElementDefinition, DataSchemaDefinition, DataSchemaInlineElementDefinition } from './dataschema.js';
/**
 * View-to-model conversion helper for object elements.
 *
 * Preserves object element content in `htmlContent` attribute.
 *
 * @returns Returns a conversion callback.
*/
export declare function viewToModelObjectConverter({ model: modelName }: DataSchemaDefinition): (viewElement: ViewElement, conversionApi: UpcastConversionApi) => Element;
/**
 * Conversion helper converting an object element to an HTML object widget.
 *
 * @returns Returns a conversion callback.
*/
export declare function toObjectWidgetConverter(editor: Editor, { view: viewName, isInline }: DataSchemaInlineElementDefinition): ElementCreatorFunction;
/**
* Creates object view element from the given model element.
*/
export declare function createObjectView(viewName: string, modelElement: Element, writer: DowncastWriter): ViewElement;
/**
 * View-to-attribute conversion helper preserving inline element attributes on `$text`.
 *
 * @returns Returns a conversion callback.
*/
export declare function viewToAttributeInlineConverter({ view: viewName, model: attributeKey, allowEmpty }: DataSchemaInlineElementDefinition, dataFilter: DataFilter): (dispatcher: UpcastDispatcher) => void;
/**
 * Conversion helper converting an empty inline model element to an HTML element or widget.
 */
export declare function emptyInlineModelElementToViewConverter({ model: attributeKey, view: viewName }: DataSchemaInlineElementDefinition, asWidget?: boolean): ElementCreatorFunction;
/**
 * Attribute-to-view conversion helper applying attributes to view element preserved on `$text`.
 *
 * @returns Returns a conversion callback.
*/
export declare function attributeToViewInlineConverter({ priority, view: viewName }: DataSchemaInlineElementDefinition): (attributeValue: any, conversionApi: DowncastConversionApi) => AttributeElement | undefined;
/**
 * View-to-model conversion helper preserving allowed attributes on block element.
 *
 * All matched attributes will be preserved on `html*Attributes` attribute.
 *
 * @returns Returns a conversion callback.
*/
export declare function viewToModelBlockAttributeConverter({ view: viewName }: DataSchemaBlockElementDefinition, dataFilter: DataFilter): (dispatcher: UpcastDispatcher) => void;
/**
 * Model-to-view conversion helper applying attributes preserved in `html*Attributes` attribute
 * for block elements.
 *
 * @returns Returns a conversion callback.
*/
export declare function modelToViewBlockAttributeConverter({ view: viewName, model: modelName }: DataSchemaBlockElementDefinition): (dispatcher: DowncastDispatcher) => void;
