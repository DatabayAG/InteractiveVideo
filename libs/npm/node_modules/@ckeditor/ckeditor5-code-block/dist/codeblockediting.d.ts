/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { ShiftEnter } from 'ckeditor5/src/enter.js';
/**
 * The editing part of the code block feature.
 *
 * Introduces the `'codeBlock'` command and the `'codeBlock'` model element.
 */
export default class CodeBlockEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CodeBlockEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ShiftEnter];
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * @inheritDoc
     */
    afterInit(): void;
    /**
     * Observe when user enters or leaves code block and set proper aria value in global live announcer.
     * This allows screen readers to indicate when the user has entered and left the specified code block.
     *
     * @internal
     */
    private _initAriaAnnouncements;
}
