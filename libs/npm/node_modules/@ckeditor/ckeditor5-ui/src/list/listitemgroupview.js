/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/list/listitemgroupview
 */
import View from '../view.js';
import ListView from './listview.js';
import LabelView from '../label/labelview.js';
import ListSeparatorView from './listseparatorview.js';
/**
 * The list item group view class.
 */
export default class ListItemGroupView extends View {
    /**
     * Creates an instance of the list item group view class.
     *
     * @param locale The {@link module:core/editor/editor~Editor#locale} instance.
     * @param labelView The instance of the group's label. If not provided, an instance of
     * {@link module:ui/label/labelview~LabelView} is used.
     */
    constructor(locale, labelView = new LabelView()) {
        super(locale);
        const bind = this.bindTemplate;
        const nestedList = new ListView(locale);
        this.set({
            label: '',
            isVisible: true
        });
        this.labelView = labelView;
        this.labelView.bind('text').to(this, 'label');
        this.children = this.createCollection();
        this.children.addMany([this.labelView, nestedList]);
        nestedList.set({
            role: 'group',
            ariaLabelledBy: labelView.id
        });
        // Disable focus tracking and accessible navigation in the child list.
        nestedList.focusTracker.destroy();
        nestedList.keystrokes.destroy();
        this.items = nestedList.items;
        this.setTemplate({
            tag: 'li',
            attributes: {
                role: 'presentation',
                class: [
                    'ck',
                    'ck-list__group',
                    bind.if('isVisible', 'ck-hidden', value => !value)
                ]
            },
            children: this.children
        });
    }
    /**
     * Focuses the list item (which is not a separator).
     */
    focus() {
        if (this.items) {
            const firstListItem = this.items.find(item => !(item instanceof ListSeparatorView));
            if (firstListItem) {
                firstListItem.focus();
            }
        }
    }
}
