/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/list/listitemview
 */
import View from '../view.js';
/**
 * The list item view class.
 */
export default class ListItemView extends View {
    /**
     * @inheritDoc
     */
    constructor(locale) {
        super(locale);
        const bind = this.bindTemplate;
        this.set('isVisible', true);
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'li',
            attributes: {
                class: [
                    'ck',
                    'ck-list__item',
                    bind.if('isVisible', 'ck-hidden', value => !value)
                ],
                role: 'presentation'
            },
            children: this.children
        });
    }
    /**
     * Focuses the list item.
     */
    focus() {
        if (this.children.first) {
            this.children.first.focus();
        }
    }
}
