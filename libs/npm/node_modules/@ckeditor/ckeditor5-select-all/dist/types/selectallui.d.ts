/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module select-all/selectallui
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
/**
 * The select all UI feature.
 *
 * It registers the `'selectAll'` UI button in the editor's
 * {@link module:ui/componentfactory~ComponentFactory component factory}. When clicked, the button
 * executes the {@link module:select-all/selectallcommand~SelectAllCommand select all command}.
 */
export default class SelectAllUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "SelectAllUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Creates a button for select all command to use either in toolbar or in menu bar.
     */
    private _createButton;
}
