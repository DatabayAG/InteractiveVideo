/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/autoimage
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { Clipboard } from 'ckeditor5/src/clipboard.js';
import { Undo } from 'ckeditor5/src/undo.js';
import { Delete } from 'ckeditor5/src/typing.js';
import ImageUtils from './imageutils.js';
/**
 * The auto-image plugin. It recognizes image links in the pasted content and embeds
 * them shortly after they are injected into the document.
 */
export default class AutoImage extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof Clipboard, typeof ImageUtils, typeof Undo, typeof Delete];
    /**
     * @inheritDoc
     */
    static get pluginName(): "AutoImage";
    /**
     * The paste–to–embed `setTimeout` ID. Stored as a property to allow
     * cleaning of the timeout.
     */
    private _timeoutId;
    /**
     * The position where the `<imageBlock>` element will be inserted after the timeout,
     * determined each time a new content is pasted into the document.
     */
    private _positionToInsert;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Analyzes the part of the document between provided positions in search for a URL representing an image.
     * When the URL is found, it is automatically converted into an image.
     *
     * @param leftPosition Left position of the selection.
     * @param rightPosition Right position of the selection.
     */
    private _embedImageBetweenPositions;
}
