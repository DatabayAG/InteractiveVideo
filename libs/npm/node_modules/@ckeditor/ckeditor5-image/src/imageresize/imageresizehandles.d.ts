/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { WidgetResize } from 'ckeditor5/src/widget.js';
import ImageUtils from '../imageutils.js';
/**
 * The image resize by handles feature.
 *
 * It adds the ability to resize each image using handles or manually by
 * {@link module:image/imageresize/imageresizebuttons~ImageResizeButtons} buttons.
 */
export default class ImageResizeHandles extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof WidgetResize, typeof ImageUtils];
    /**
     * @inheritDoc
     */
    static get pluginName(): "ImageResizeHandles";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Attaches the listeners responsible for creating a resizer for each image, except for images inside the HTML embed preview.
     */
    private _setupResizerCreator;
}
