/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module link/utils/manualdecorator
 */
import { ObservableMixin } from 'ckeditor5/src/utils.js';
/**
 * Helper class that stores manual decorators with observable {@link module:link/utils/manualdecorator~ManualDecorator#value}
 * to support integration with the UI state. An instance of this class is a model with the state of individual manual decorators.
 * These decorators are kept as collections in {@link module:link/linkcommand~LinkCommand#manualDecorators}.
 */
export default class ManualDecorator extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates a new instance of {@link module:link/utils/manualdecorator~ManualDecorator}.
     *
     * @param config.id The name of the attribute used in the model that represents a given manual decorator.
     * For example: `'linkIsExternal'`.
     * @param config.label The label used in the user interface to toggle the manual decorator.
     * @param config.attributes A set of attributes added to output data when the decorator is active for a specific link.
     * Attributes should keep the format of attributes defined in {@link module:engine/view/elementdefinition~ElementDefinition}.
     * @param [config.defaultValue] Controls whether the decorator is "on" by default.
     */
    constructor({ id, label, attributes, classes, styles, defaultValue }) {
        super();
        this.id = id;
        this.set('value', undefined);
        this.defaultValue = defaultValue;
        this.label = label;
        this.attributes = attributes;
        this.classes = classes;
        this.styles = styles;
    }
    /**
     * Returns {@link module:engine/view/matcher~MatcherPattern} with decorator attributes.
     *
     * @internal
     */
    _createPattern() {
        return {
            attributes: this.attributes,
            classes: this.classes,
            styles: this.styles
        };
    }
}
