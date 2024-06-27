/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/imagetextalternative/imagetextalternativeediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import ImageUtils from '../imageutils.js';
/**
 * The image text alternative editing plugin.
 *
 * Registers the `'imageTextAlternative'` command.
 */
export default class ImageTextAlternativeEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ImageUtils];
    /**
     * @inheritDoc
     */
    static get pluginName(): "ImageTextAlternativeEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
