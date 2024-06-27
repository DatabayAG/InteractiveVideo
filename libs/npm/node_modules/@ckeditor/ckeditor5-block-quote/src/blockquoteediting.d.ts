/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module block-quote/blockquoteediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { Enter } from 'ckeditor5/src/enter.js';
import { Delete } from 'ckeditor5/src/typing.js';
/**
 * The block quote editing.
 *
 * Introduces the `'blockQuote'` command and the `'blockQuote'` model element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class BlockQuoteEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "BlockQuoteEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof Enter, typeof Delete];
    /**
     * @inheritDoc
     */
    init(): void;
}
