/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module typing/texttransformation
 */
import { Plugin, type Editor } from '@ckeditor/ckeditor5-core';
/**
 * The text transformation plugin.
 */
export default class TextTransformation extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly ["Delete", "Input"];
    /**
     * @inheritDoc
     */
    static get pluginName(): "TextTransformation";
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Create new TextWatcher listening to the editor for typing and selection events.
     */
    private _enableTransformationWatchers;
}
