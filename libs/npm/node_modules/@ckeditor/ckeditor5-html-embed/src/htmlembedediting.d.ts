/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-embed/htmlembedediting
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import '../theme/htmlembed.css';
/**
 * The HTML embed editing feature.
 */
export default class HtmlEmbedEditing extends Plugin {
    /**
     * Keeps references to {@link module:ui/button/buttonview~ButtonView edit, save, and cancel} button instances created for
     * each widget so they can be destroyed if they are no longer in DOM after the editing view was re-rendered.
     */
    private _widgetButtonViewReferences;
    /**
     * @inheritDoc
     */
    static get pluginName(): "HtmlEmbedEditing";
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Prepares converters for the feature.
     */
    private _setupConversion;
}
export interface RawHtmlApi {
    makeEditable(): void;
    save(newValue: string): void;
    cancel(): void;
}
