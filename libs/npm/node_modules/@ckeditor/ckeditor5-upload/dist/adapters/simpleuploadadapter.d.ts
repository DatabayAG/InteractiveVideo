/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module upload/adapters/simpleuploadadapter
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
import FileRepository from '../filerepository.js';
/**
 * The Simple upload adapter allows uploading images to an application running on your server using
 * the [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) API with a
 * minimal {@link module:upload/uploadconfig~SimpleUploadConfig editor configuration}.
 *
 * ```ts
 * ClassicEditor
 * 	.create( document.querySelector( '#editor' ), {
 * 		simpleUpload: {
 * 			uploadUrl: 'http://example.com',
 * 			headers: {
 * 				...
 * 			}
 * 		}
 * 	} )
 * 	.then( ... )
 * 	.catch( ... );
 * ```
 *
 * See the {@glink features/images/image-upload/simple-upload-adapter "Simple upload adapter"} guide to learn how to
 * learn more about the feature (configuration, server–side requirements, etc.).
 *
 * Check out the {@glink features/images/image-upload/image-upload comprehensive "Image upload overview"} to learn about
 * other ways to upload images into CKEditor 5.
 */
export default class SimpleUploadAdapter extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof FileRepository];
    /**
     * @inheritDoc
     */
    static get pluginName(): "SimpleUploadAdapter";
    /**
     * @inheritDoc
     */
    init(): void;
}
