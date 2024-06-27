/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
* @module table/tablecaption/tablecaptionui
*/
import { Plugin } from 'ckeditor5/src/core.js';
/**
  * The table caption UI plugin. It introduces the `'toggleTableCaption'` UI button.
  */
export default class TableCaptionUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "TableCaptionUI";
    /**
     * @inheritDoc
     */
    init(): void;
}
