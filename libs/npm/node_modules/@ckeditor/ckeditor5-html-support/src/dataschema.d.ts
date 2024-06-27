/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/dataschema
 */
import { Plugin } from 'ckeditor5/src/core.js';
import type { AttributeProperties, SchemaItemDefinition } from 'ckeditor5/src/engine.js';
/**
 * Holds representation of the extended HTML document type definitions to be used by the
 * editor in HTML support.
 *
 * Data schema is represented by data schema definitions.
 *
 * To add new definition for block element,
 * use {@link module:html-support/dataschema~DataSchema#registerBlockElement} method:
 *
 * ```ts
 * dataSchema.registerBlockElement( {
 * 	view: 'section',
 * 	model: 'my-section',
 * 	modelSchema: {
 * 		inheritAllFrom: '$block'
 * 	}
 * } );
 * ```
 *
 * To add new definition for inline element,
 * use {@link module:html-support/dataschema~DataSchema#registerInlineElement} method:
 *
 * ```
 * dataSchema.registerInlineElement( {
 * 	view: 'span',
 * 	model: 'my-span',
 * 	attributeProperties: {
 * 		copyOnEnter: true
 * 	}
 * } );
 * ```
 */
export default class DataSchema extends Plugin {
    /**
     * A map of registered data schema definitions.
     */
    private readonly _definitions;
    /**
     * @inheritDoc
     */
    static get pluginName(): "DataSchema";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Add new data schema definition describing block element.
     */
    registerBlockElement(definition: DataSchemaBlockElementDefinition): void;
    /**
     * Add new data schema definition describing inline element.
     */
    registerInlineElement(definition: DataSchemaInlineElementDefinition): void;
    /**
     * Updates schema definition describing block element with new properties.
     *
     * Creates new scheme if it doesn't exist.
     * Array properties are concatenated with original values.
     *
     * @param definition Definition update.
     */
    extendBlockElement(definition: DataSchemaBlockElementDefinition): void;
    /**
     * Updates schema definition describing inline element with new properties.
     *
     * Creates new scheme if it doesn't exist.
     * Array properties are concatenated with original values.
     *
     * @param definition Definition update.
     */
    extendInlineElement(definition: DataSchemaInlineElementDefinition): void;
    /**
     * Returns all definitions matching the given view name.
     *
     * @param includeReferences Indicates if this method should also include definitions of referenced models.
     */
    getDefinitionsForView(viewName: string | RegExp, includeReferences?: boolean): Set<DataSchemaDefinition>;
    /**
     * Returns definitions matching the given model name.
     */
    getDefinitionsForModel(modelName: string): Array<DataSchemaDefinition>;
    /**
     * Returns definitions matching the given view name.
     */
    private _getMatchingViewDefinitions;
    /**
     * Resolves all definition references registered for the given data schema definition.
     *
     * @param modelName Data schema model name.
     */
    private _getReferences;
    /**
     * Updates schema definition with new properties.
     *
     * Creates new scheme if it doesn't exist.
     * Array properties are concatenated with original values.
     *
     * @param definition Definition update.
     */
    private _extendDefinition;
}
/**
 * A base definition of {@link module:html-support/dataschema~DataSchema data schema}.
 */
export interface DataSchemaDefinition {
    /**
     * Name of the model.
     */
    model: string;
    /**
     * Name of the view element.
     */
    view?: string;
    /**
     * Indicates that the definition describes object element.
     */
    isObject?: boolean;
    /**
     * The model schema item definition describing registered model.
     */
    modelSchema?: SchemaItemDefinition;
    /**
     * Indicates that the definition describes block element.
     * Set by {@link module:html-support/dataschema~DataSchema#registerBlockElement} method.
     */
    isBlock?: boolean;
    /**
     * Indicates that the definition describes inline element.
     */
    isInline?: boolean;
}
/**
 * A definition of {@link module:html-support/dataschema~DataSchema data schema} for block elements.
 */
export interface DataSchemaBlockElementDefinition extends DataSchemaDefinition {
    /**
     * Should be used when an element can behave both as a sectioning element (e.g. article) and
     * element accepting only inline content (e.g. paragraph).
     * If an element contains only inline content, this option will be used as a model name.
     */
    paragraphLikeModel?: string;
}
/**
 * A definition of {@link module:html-support/dataschema~DataSchema data schema} for inline elements.
 */
export interface DataSchemaInlineElementDefinition extends DataSchemaDefinition {
    /**
     *  Additional metadata describing the model attribute.
     */
    attributeProperties?: AttributeProperties;
    /**
     * Element priority. Decides in what order elements are wrapped by
     * {@link module:engine/view/downcastwriter~DowncastWriter}.
     * Set by {@link module:html-support/dataschema~DataSchema#registerInlineElement} method.
     */
    priority?: number;
    /**
     * The name of the model attribute that generates the same view element. GHS inline attribute
     * will be removed from the model tree as soon as the coupled attribute is removed. See
     * {@link module:html-support/datafilter~DataFilter#_registerCoupledAttributesPostFixer GHS post-fixer} for more details.
     */
    coupledAttribute?: string;
    /**
     * Indicates that element should not be converted as a model text attribute.
     * It is used to map view elements that do not have a separate model element but their data is stored in a model attribute.
     * For example `<tbody>` element does not have a dedicated model element and GHS stores attributes of `<tbody>`
     * in the `htmlTbodyAttributes` model attribute of the `table` model element.
     */
    appliesToBlock?: boolean | string;
    /**
     * Indicates that an element should be preserved even if it has no content.
     */
    allowEmpty?: boolean;
}
