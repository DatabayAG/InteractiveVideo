/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import InputBase from './inputbase.js';
import '../../theme/components/input/input.css';
/**
 * The input view class.
 */
export default class InputView extends InputBase {
    /**
     * @inheritDoc
     */
    constructor(locale) {
        super(locale);
        this.set('inputMode', 'text');
        const bind = this.bindTemplate;
        this.extendTemplate({
            attributes: {
                inputmode: bind.to('inputMode')
            }
        });
    }
}
