/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/integrations/heading
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { Enter } from 'ckeditor5/src/enter.js';
import DataSchema from '../dataschema.js';
/**
 * Provides the General HTML Support integration with {@link module:heading/heading~Heading Heading} feature.
 */
export default class HeadingElementSupport extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof DataSchema, typeof Enter];
    /**
     * @inheritDoc
     */
    static get pluginName(): "HeadingElementSupport";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Registers all elements supported by HeadingEditing to enable custom attributes for those elements.
     */
    private registerHeadingElements;
}
