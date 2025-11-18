/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module editor-balloon/ballooneditorui
 */
import { type Editor } from 'ckeditor5/src/core.js';
import { EditorUI } from 'ckeditor5/src/ui.js';
import type BalloonEditorUIView from './ballooneditoruiview.js';
/**
 * The balloon editor UI class.
 */
export default class BalloonEditorUI extends EditorUI {
    /**
     * The main (top–most) view of the editor UI.
     */
    readonly view: BalloonEditorUIView;
    /**
     * Creates an instance of the balloon editor UI class.
     *
     * @param editor The editor instance.
     * @param view The view of the UI.
     */
    constructor(editor: Editor, view: BalloonEditorUIView);
    /**
     * @inheritDoc
     */
    get element(): HTMLElement | null;
    /**
     * Initializes the UI.
     */
    init(): void;
    /**
     * @inheritDoc
     */
    destroy(): void;
    /**
     * Enable the placeholder text on the editing root.
     */
    private _initPlaceholder;
}
