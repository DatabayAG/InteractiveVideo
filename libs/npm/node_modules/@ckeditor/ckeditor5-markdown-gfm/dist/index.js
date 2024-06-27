/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import { HtmlDataProcessor } from '@ckeditor/ckeditor5-engine/dist/index.js';
import { marked } from 'marked';
import Turndown from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { ClipboardPipeline } from '@ckeditor/ckeditor5-clipboard/dist/index.js';

/**
 * This is a helper class used by the {@link module:markdown-gfm/markdown Markdown feature} to convert Markdown to HTML.
 */ class MarkdownToHtml {
    _parser;
    _options = {
        gfm: true,
        breaks: true,
        tables: true,
        xhtml: true,
        headerIds: false
    };
    constructor(){
        // Overrides.
        marked.use({
            tokenizer: {
                // Disable the autolink rule in the lexer.
                autolink: ()=>null,
                url: ()=>null
            },
            renderer: {
                checkbox (...args) {
                    // Remove bogus space after <input type="checkbox"> because it would be preserved
                    // by DomConverter as it's next to an inline object.
                    return Object.getPrototypeOf(this).checkbox.call(this, ...args).trimRight();
                },
                code (...args) {
                    // Since marked v1.2.8, every <code> gets a trailing "\n" whether it originally
                    // ended with one or not (see https://github.com/markedjs/marked/issues/1884 to learn why).
                    // This results in a redundant soft break in the model when loaded into the editor, which
                    // is best prevented at this stage. See https://github.com/ckeditor/ckeditor5/issues/11124.
                    return Object.getPrototypeOf(this).code.call(this, ...args).replace('\n</code>', '</code>');
                }
            }
        });
        this._parser = marked;
    }
    parse(markdown) {
        return this._parser.parse(markdown, this._options);
    }
}

const autolinkRegex = /* #__PURE__ */ new RegExp(// Prefix.
/\b(?:(?:https?|ftp):\/\/|www\.)/.source + // Domain name.
/(?![-_])(?:[-_a-z0-9\u00a1-\uffff]{1,63}\.)+(?:[a-z\u00a1-\uffff]{2,63})/.source + // The rest.
/(?:[^\s<>]*)/.source, 'gi');
class UpdatedTurndown extends Turndown {
    escape(string) {
        const originalEscape = super.escape;
        function escape(string) {
            string = originalEscape(string);
            // Escape "<".
            string = string.replace(/</g, '\\<');
            return string;
        }
        // Urls should not be escaped. Our strategy is using a regex to find them and escape everything
        // which is out of the matches parts.
        let escaped = '';
        let lastLinkEnd = 0;
        for (const match of this._matchAutolink(string)){
            const index = match.index;
            // Append the substring between the last match and the current one (if anything).
            if (index > lastLinkEnd) {
                escaped += escape(string.substring(lastLinkEnd, index));
            }
            const matchedURL = match[0];
            escaped += matchedURL;
            lastLinkEnd = index + matchedURL.length;
        }
        // Add text after the last link or at the string start if no matches.
        if (lastLinkEnd < string.length) {
            escaped += escape(string.substring(lastLinkEnd, string.length));
        }
        return escaped;
    }
    /**
	 * Trimming end of link.
	 * https://github.github.com/gfm/#autolinks-extension-
	 */ *_matchAutolink(string) {
        for (const match of string.matchAll(autolinkRegex)){
            const matched = match[0];
            const length = this._autolinkFindEnd(matched);
            yield Object.assign([
                matched.substring(0, length)
            ], {
                index: match.index
            });
        // We could adjust regex.lastIndex but it's not needed because what we skipped is for sure not a valid URL.
        }
    }
    /**
	 * Returns the new length of the link (after it would trim trailing characters).
	 */ _autolinkFindEnd(string) {
        let length = string.length;
        while(length > 0){
            const char = string[length - 1];
            if ('?!.,:*_~\'"'.includes(char)) {
                length--;
            } else if (char == ')') {
                let openBrackets = 0;
                for(let i = 0; i < length; i++){
                    if (string[i] == '(') {
                        openBrackets++;
                    } else if (string[i] == ')') {
                        openBrackets--;
                    }
                }
                // If there is fewer opening brackets then closing ones we should remove a closing bracket.
                if (openBrackets < 0) {
                    length--;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        return length;
    }
}
/**
 * This is a helper class used by the {@link module:markdown-gfm/markdown Markdown feature} to convert HTML to Markdown.
 */ class HtmlToMarkdown {
    _parser;
    constructor(){
        this._parser = this._createParser();
    }
    parse(html) {
        return this._parser.turndown(html);
    }
    keep(elements) {
        this._parser.keep(elements);
    }
    _createParser() {
        const parser = new UpdatedTurndown({
            codeBlockStyle: 'fenced',
            hr: '---',
            headingStyle: 'atx'
        });
        parser.use([
            gfm,
            this._todoList
        ]);
        return parser;
    }
    // This is a copy of the original taskListItems rule from turndown-plugin-gfm, with minor changes.
    _todoList(turndown) {
        turndown.addRule('taskListItems', {
            filter (node) {
                return node.type === 'checkbox' && // Changes here as CKEditor outputs a deeper structure.
                (node.parentNode.nodeName === 'LI' || node.parentNode.parentNode.nodeName === 'LI');
            },
            replacement (content, node) {
                return (node.checked ? '[x]' : '[ ]') + ' ';
            }
        });
    }
}

/**
 * This data processor implementation uses GitHub Flavored Markdown as input/output data.
 *
 * See the {@glink features/markdown Markdown output} guide to learn more on how to enable it.
 */ class GFMDataProcessor {
    /**
	 * HTML data processor used to process HTML produced by the Markdown-to-HTML converter and the other way.
	 */ _htmlDP;
    /**
	 * Helper for converting Markdown to HTML.
	 */ _markdown2html;
    /**
	 * Helper for converting HTML to Markdown.
	 */ _html2markdown;
    /**
	 * Creates a new instance of the Markdown data processor class.
	 */ constructor(document){
        this._htmlDP = new HtmlDataProcessor(document);
        this._markdown2html = new MarkdownToHtml();
        this._html2markdown = new HtmlToMarkdown();
    }
    /**
	 * Keeps the specified element in the output as HTML. This is useful if the editor contains
	 * features producing HTML that is not a part of the Markdown standard.
	 *
	 * By default, all HTML tags are removed.
	 *
	 * @param element The element name to be kept.
	 */ keepHtml(element) {
        this._html2markdown.keep([
            element
        ]);
    }
    /**
	 * Converts the provided Markdown string to a view tree.
	 *
	 * @param data A Markdown string.
	 * @returns The converted view element.
	 */ toView(data) {
        const html = this._markdown2html.parse(data);
        return this._htmlDP.toView(html);
    }
    /**
	 * Converts the provided {@link module:engine/view/documentfragment~DocumentFragment} to data format &ndash; in this
	 * case to a Markdown string.
	 *
	 * @returns Markdown string.
	 */ toData(viewFragment) {
        const html = this._htmlDP.toData(viewFragment);
        return this._html2markdown.parse(html);
    }
    /**
	 * Registers a {@link module:engine/view/matcher~MatcherPattern} for view elements whose content should be treated as raw data
	 * and not processed during the conversion from Markdown to view elements.
	 *
	 * The raw data can be later accessed by a
	 * {@link module:engine/view/element~Element#getCustomProperty custom property of a view element} called `"$rawContent"`.
	 *
	 * @param pattern The pattern matching all view elements whose content should
	 * be treated as raw data.
	 */ registerRawContentMatcher(pattern) {
        this._htmlDP.registerRawContentMatcher(pattern);
    }
    /**
	 * This method does not have any effect on the data processor result. It exists for compatibility with the
	 * {@link module:engine/dataprocessor/dataprocessor~DataProcessor `DataProcessor` interface}.
	 */ useFillerType() {}
}

/**
 * The GitHub Flavored Markdown (GFM) plugin.
 *
 * For a detailed overview, check the {@glink features/markdown Markdown feature} guide.
 */ class Markdown extends Plugin {
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        editor.data.processor = new GFMDataProcessor(editor.data.viewDocument);
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Markdown';
    }
}

const ALLOWED_MARKDOWN_FIRST_LEVEL_TAGS = [
    'SPAN',
    'BR',
    'PRE',
    'CODE'
];
/**
 * The GitHub Flavored Markdown (GFM) paste plugin.
 *
 * For a detailed overview, check the {@glink features/pasting/paste-markdown Paste Markdown feature} guide.
 */ class PasteFromMarkdownExperimental extends Plugin {
    /**
	 * @internal
	 */ _gfmDataProcessor;
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        this._gfmDataProcessor = new GFMDataProcessor(editor.data.viewDocument);
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'PasteFromMarkdownExperimental';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ClipboardPipeline
        ];
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;
        const clipboardPipeline = editor.plugins.get('ClipboardPipeline');
        let shiftPressed = false;
        this.listenTo(viewDocument, 'keydown', (evt, data)=>{
            shiftPressed = data.shiftKey;
        });
        this.listenTo(clipboardPipeline, 'inputTransformation', (evt, data)=>{
            if (shiftPressed) {
                return;
            }
            const dataAsTextHtml = data.dataTransfer.getData('text/html');
            if (!dataAsTextHtml) {
                const dataAsTextPlain = data.dataTransfer.getData('text/plain');
                data.content = this._gfmDataProcessor.toView(dataAsTextPlain);
                return;
            }
            const markdownFromHtml = this._parseMarkdownFromHtml(dataAsTextHtml);
            if (markdownFromHtml) {
                data.content = this._gfmDataProcessor.toView(markdownFromHtml);
            }
        });
    }
    /**
	 * Determines if the code copied from a website in the `text/html` type can be parsed as Markdown.
	 * It removes any OS-specific HTML tags, for example, <meta> on macOS and <!--StartFragment--> on Windows.
	 * Then removes a single wrapper HTML tag or wrappers for sibling tags, and if there are no more tags left,
	 * returns the remaining text. Returns null if there are any remaining HTML tags detected.
	 *
	 * @param htmlString Clipboard content in the `text/html` type format.
	 */ _parseMarkdownFromHtml(htmlString) {
        const withoutOsSpecificTags = this._removeOsSpecificTags(htmlString);
        if (!this._containsOnlyAllowedFirstLevelTags(withoutOsSpecificTags)) {
            return null;
        }
        const withoutWrapperTag = this._removeFirstLevelWrapperTagsAndBrs(withoutOsSpecificTags);
        if (this._containsAnyRemainingHtmlTags(withoutWrapperTag)) {
            return null;
        }
        return this._replaceHtmlReservedEntitiesWithCharacters(withoutWrapperTag);
    }
    /**
	 * Removes OS-specific tags.
	 *
	 * @param htmlString Clipboard content in the `text/html` type format.
	 */ _removeOsSpecificTags(htmlString) {
        // Removing the <meta> tag present on Mac.
        const withoutMetaTag = htmlString.replace(/^<meta\b[^>]*>/, '').trim();
        // Removing the <html> tag present on Windows.
        const withoutHtmlTag = withoutMetaTag.replace(/^<html>/, '').replace(/<\/html>$/, '').trim();
        // Removing the <body> tag present on Windows.
        const withoutBodyTag = withoutHtmlTag.replace(/^<body>/, '').replace(/<\/body>$/, '').trim();
        // Removing the <!--StartFragment--> tag present on Windows.
        return withoutBodyTag.replace(/^<!--StartFragment-->/, '').replace(/<!--EndFragment-->$/, '').trim();
    }
    /**
	 * If the input HTML string contains any first-level formatting tags
	 * like <b>, <strong>, or <i>, we should not treat it as Markdown.
	 *
	 * @param htmlString Clipboard content.
	 */ _containsOnlyAllowedFirstLevelTags(htmlString) {
        const parser = new DOMParser();
        const { body: tempElement } = parser.parseFromString(htmlString, 'text/html');
        const tagNames = Array.from(tempElement.children).map((el)=>el.tagName);
        return tagNames.every((el)=>ALLOWED_MARKDOWN_FIRST_LEVEL_TAGS.includes(el));
    }
    /**
	 * Removes multiple HTML wrapper tags from a list of sibling HTML tags.
	 *
	 * @param htmlString Clipboard content without any OS-specific tags.
	 */ _removeFirstLevelWrapperTagsAndBrs(htmlString) {
        const parser = new DOMParser();
        const { body: tempElement } = parser.parseFromString(htmlString, 'text/html');
        const brElements = tempElement.querySelectorAll('br');
        for (const br of brElements){
            br.replaceWith('\n');
        }
        const outerElements = tempElement.querySelectorAll(':scope > *');
        for (const element of outerElements){
            const elementClone = element.cloneNode(true);
            element.replaceWith(...elementClone.childNodes);
        }
        return tempElement.innerHTML;
    }
    /**
	 * Determines if a string contains any HTML tags.
	 */ _containsAnyRemainingHtmlTags(str) {
        return str.includes('<');
    }
    /**
	 * Replaces the reserved HTML entities with the actual characters.
	 *
	 * @param htmlString Clipboard content without any tags.
	 */ _replaceHtmlReservedEntitiesWithCharacters(htmlString) {
        return htmlString.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ');
    }
}

export { Markdown, PasteFromMarkdownExperimental };
//# sourceMappingURL=index.js.map
