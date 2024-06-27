/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin } from 'ckeditor5/src/core.js';
import LinkUI from './linkui.js';
import LinkEditing from './linkediting.js';
/**
 * The link image UI plugin.
 *
 * This plugin provides the `'linkImage'` button that can be displayed in the {@link module:image/imagetoolbar~ImageToolbar}.
 * It can be used to wrap images in links.
 */
export default class LinkImageUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof LinkEditing, typeof LinkUI, "ImageBlockEditing"];
    /**
     * @inheritDoc
     */
    static get pluginName(): "LinkImageUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a `LinkImageUI` button view.
     *
     * Clicking this button shows a {@link module:link/linkui~LinkUI#_balloon} attached to the selection.
     * When an image is already linked, the view shows {@link module:link/linkui~LinkUI#actionsView} or
     * {@link module:link/linkui~LinkUI#formView} if it is not.
     */
    private _createToolbarLinkImageButton;
    /**
     * Returns true if a linked image (either block or inline) is the only selected element
     * in the model document.
     */
    private _isSelectedLinkedImage;
}
