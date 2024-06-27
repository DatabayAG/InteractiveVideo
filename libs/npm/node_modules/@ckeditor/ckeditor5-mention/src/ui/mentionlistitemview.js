/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module mention/ui/mentionlistitemview
 */
import { ListItemView } from 'ckeditor5/src/ui.js';
export default class MentionListItemView extends ListItemView {
    highlight() {
        const child = this.children.first;
        child.isOn = true;
    }
    removeHighlight() {
        const child = this.children.first;
        child.isOn = false;
    }
}
