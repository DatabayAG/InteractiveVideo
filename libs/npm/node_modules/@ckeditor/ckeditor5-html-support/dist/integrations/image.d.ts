/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/integrations/image
 */
import { Plugin } from 'ckeditor5/src/core.js';
import DataFilter from '../datafilter.js';
/**
 * Provides the General HTML Support integration with the {@link module:image/image~Image Image} feature.
 */
export default class ImageElementSupport extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof DataFilter];
    /**
     * @inheritDoc
     */
    static get pluginName(): "ImageElementSupport";
    /**
     * @inheritDoc
     */
    init(): void;
}
