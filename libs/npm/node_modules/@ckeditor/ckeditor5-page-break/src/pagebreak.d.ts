/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module page-break/pagebreak
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { Widget } from 'ckeditor5/src/widget.js';
import PageBreakEditing from './pagebreakediting.js';
import PageBreakUI from './pagebreakui.js';
/**
 * The page break feature.
 *
 * It provides the possibility to insert a page break into the rich-text editor.
 *
 * For a detailed overview, check the {@glink features/page-break Page break feature} documentation.
 */
export default class PageBreak extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof PageBreakEditing, typeof PageBreakUI, typeof Widget];
    /**
     * @inheritDoc
     */
    static get pluginName(): "PageBreak";
}
