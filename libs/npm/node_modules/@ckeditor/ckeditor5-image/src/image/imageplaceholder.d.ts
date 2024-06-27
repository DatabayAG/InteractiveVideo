/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/image/imageplaceholder
 */
import { Plugin } from 'ckeditor5/src/core.js';
import ImageUtils from '../imageutils.js';
import '../../theme/imageplaceholder.css';
/**
 * Adds support for image placeholder that is automatically removed when the image is loaded.
 */
export default class ImagePlaceholder extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ImageUtils];
    /**
     * @inheritDoc
     */
    static get pluginName(): "ImagePlaceholder";
    /**
     * @inheritDoc
     */
    afterInit(): void;
    /**
     * Extends model schema.
     */
    private _setupSchema;
    /**
     * Registers converters.
     */
    private _setupConversion;
    /**
     * Prepares listener for image load.
     */
    private _setupLoadListener;
}
