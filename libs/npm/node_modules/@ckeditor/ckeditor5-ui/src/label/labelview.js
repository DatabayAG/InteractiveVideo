/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/label/labelview
 */
import View from '../view.js';
import { uid } from '@ckeditor/ckeditor5-utils';
import '../../theme/components/label/label.css';
/**
 * The label view class.
 */
export default class LabelView extends View {
    /**
     * @inheritDoc
     */
    constructor(locale) {
        super(locale);
        this.set('text', undefined);
        this.set('for', undefined);
        this.id = `ck-editor__label_${uid()}`;
        const bind = this.bindTemplate;
        this.setTemplate({
            tag: 'label',
            attributes: {
                class: [
                    'ck',
                    'ck-label'
                ],
                id: this.id,
                for: bind.to('for')
            },
            children: [
                {
                    text: bind.to('text')
                }
            ]
        });
    }
}
