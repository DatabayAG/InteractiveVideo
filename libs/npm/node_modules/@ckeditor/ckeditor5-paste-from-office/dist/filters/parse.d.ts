/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module paste-from-office/filters/parse
 */
import { type StylesProcessor, type ViewDocumentFragment } from 'ckeditor5/src/engine.js';
/**
 * Parses the provided HTML extracting contents of `<body>` and `<style>` tags.
 *
 * @param htmlString HTML string to be parsed.
 */
export declare function parseHtml(htmlString: string, stylesProcessor: StylesProcessor): ParseHtmlResult;
/**
 * The result of {@link ~parseHtml}.
 */
export interface ParseHtmlResult {
    /**
     * Parsed body content as a traversable structure.
     */
    body: ViewDocumentFragment;
    /**
     * Entire body content as a string.
     */
    bodyString: string;
    /**
     * Array of native `CSSStyleSheet` objects, each representing separate `style` tag from the source HTML.
     */
    styles: Array<CSSStyleSheet>;
    /**
     * All `style` tags contents combined in the order of occurrence into one string.
     */
    stylesString: string;
}
