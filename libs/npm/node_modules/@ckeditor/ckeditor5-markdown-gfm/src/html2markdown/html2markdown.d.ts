/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module markdown-gfm/html2markdown/html2markdown
 */
import Turndown from 'turndown';
/**
 * This is a helper class used by the {@link module:markdown-gfm/markdown Markdown feature} to convert HTML to Markdown.
 */
export declare class HtmlToMarkdown {
    private _parser;
    constructor();
    parse(html: string): string;
    keep(elements: Turndown.Filter): void;
    private _createParser;
    private _todoList;
}
