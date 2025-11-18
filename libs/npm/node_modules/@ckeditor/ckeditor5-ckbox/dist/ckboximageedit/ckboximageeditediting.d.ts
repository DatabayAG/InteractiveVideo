/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ckbox/ckboximageedit/ckboximageeditediting
 */
import { PendingActions, Plugin } from 'ckeditor5/src/core.js';
import { Notification } from 'ckeditor5/src/ui.js';
import CKBoxEditing from '../ckboxediting.js';
import CKBoxUtils from '../ckboxutils.js';
/**
 * The CKBox image edit editing plugin.
 */
export default class CKBoxImageEditEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CKBoxImageEditEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof CKBoxEditing, typeof CKBoxUtils, typeof PendingActions, typeof Notification, "ImageUtils", "ImageEditing"];
    /**
     * @inheritDoc
     */
    init(): void;
}
