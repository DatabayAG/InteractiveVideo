/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/toolbar/toolbarseparatorview
 */
import View from '../view.js';
/**
 * The toolbar separator view class.
 */
export default class ToolbarSeparatorView extends View {
    /**
     * @inheritDoc
     */
    constructor(locale) {
        super(locale);
        this.setTemplate({
            tag: 'span',
            attributes: {
                class: [
                    'ck',
                    'ck-toolbar__separator'
                ]
            }
        });
    }
}
