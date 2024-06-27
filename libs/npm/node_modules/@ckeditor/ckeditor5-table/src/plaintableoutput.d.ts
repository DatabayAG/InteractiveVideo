/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/plaintableoutput
 */
import { Plugin } from 'ckeditor5/src/core.js';
import Table from './table.js';
/**
 * The plain table output feature.
 */
export default class PlainTableOutput extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "PlainTableOutput";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof Table];
    /**
     * @inheritDoc
     */
    init(): void;
}
