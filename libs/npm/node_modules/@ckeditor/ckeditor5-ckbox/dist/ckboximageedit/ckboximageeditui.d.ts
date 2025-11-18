/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ckbox/ckboximageedit/ckboximageeditui
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The UI plugin of the CKBox image edit feature.
 *
 * It registers the `'ckboxImageEdit'` UI button in the editor's {@link module:ui/componentfactory~ComponentFactory component factory}
 * that allows you to open the CKBox dialog and edit the image.
 */
export default class CKBoxImageEditUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CKBoxImageEditUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
