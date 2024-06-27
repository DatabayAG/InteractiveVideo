/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module clipboard/pasteplaintext
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
import ClipboardPipeline from './clipboardpipeline.js';
/**
 * The plugin detects the user's intention to paste plain text.
 *
 * For example, it detects the <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> keystroke.
 */
export default class PastePlainText extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "PastePlainText";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ClipboardPipeline];
    /**
     * @inheritDoc
     */
    init(): void;
}
