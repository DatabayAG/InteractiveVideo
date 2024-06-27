/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ckbox/ckboxutils
 */
import type { InitializedToken } from '@ckeditor/ckeditor5-cloud-services';
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The CKBox utilities plugin.
 */
export default class CKBoxUtils extends Plugin {
    /**
     * CKEditor Cloud Services access token.
     */
    private _token;
    /**
     * @inheritDoc
     */
    static get pluginName(): "CKBoxUtils";
    /**
     * @inheritDoc
     */
    static get requires(): readonly ["CloudServices"];
    /**
     * @inheritDoc
     */
    init(): Promise<void>;
    /**
     * Returns a token used by the CKBox plugin for communication with the CKBox service.
     */
    getToken(): InitializedToken;
    /**
     * The ID of workspace to use when uploading an image.
     */
    getWorkspaceId(): string;
    /**
     * Resolves a promise with an object containing a category with which the uploaded file is associated or an error code.
     */
    getCategoryIdForFile(fileOrUrl: File | string, options: {
        signal: AbortSignal;
    }): Promise<string>;
    /**
     * Resolves a promise with an array containing available categories with which the uploaded file can be associated.
     *
     * If the API returns limited results, the method will collect all items.
     */
    private _getAvailableCategories;
}
