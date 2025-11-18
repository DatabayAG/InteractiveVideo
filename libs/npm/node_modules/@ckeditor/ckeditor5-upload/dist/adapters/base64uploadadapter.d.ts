/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module upload/adapters/base64uploadadapter
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
import FileRepository from '../filerepository.js';
/**
 * A plugin that converts images inserted into the editor into [Base64 strings](https://en.wikipedia.org/wiki/Base64)
 * in the {@glink getting-started/setup/getting-and-setting-data editor output}.
 *
 * This kind of image upload does not require server processing – images are stored with the rest of the text and
 * displayed by the web browser without additional requests.
 *
 * Check out the {@glink features/images/image-upload/image-upload comprehensive "Image upload overview"} to learn about
 * other ways to upload images into CKEditor 5.
 */
export default class Base64UploadAdapter extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof FileRepository];
    /**
     * @inheritDoc
     */
    static get pluginName(): "Base64UploadAdapter";
    /**
     * @inheritDoc
     */
    init(): void;
}
