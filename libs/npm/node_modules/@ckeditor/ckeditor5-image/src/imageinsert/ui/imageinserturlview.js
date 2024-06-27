/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/imageinsert/ui/imageinserturlview
 */
import { View, LabeledFieldView, createLabeledInputText } from 'ckeditor5/src/ui.js';
import { KeystrokeHandler } from 'ckeditor5/src/utils.js';
/**
 * The insert an image via URL view.
 *
 * See {@link module:image/imageinsert/imageinsertviaurlui~ImageInsertViaUrlUI}.
 */
export default class ImageInsertUrlView extends View {
    /**
     * Creates a view for the dropdown panel of {@link module:image/imageinsert/imageinsertui~ImageInsertUI}.
     *
     * @param locale The localization services instance.
     */
    constructor(locale) {
        super(locale);
        this.set('imageURLInputValue', '');
        this.set('isImageSelected', false);
        this.set('isEnabled', true);
        this.keystrokes = new KeystrokeHandler();
        this.urlInputView = this._createUrlInputView();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-image-insert-url'
                ]
            },
            children: [
                this.urlInputView,
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-image-insert-url__action-row'
                        ]
                    }
                }
            ]
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        // Start listening for the keystrokes coming from #element.
        this.keystrokes.listenTo(this.element);
    }
    /**
     * @inheritDoc
     */
    destroy() {
        super.destroy();
        this.keystrokes.destroy();
    }
    /**
     * Creates the {@link #urlInputView}.
     */
    _createUrlInputView() {
        const locale = this.locale;
        const t = locale.t;
        const urlInputView = new LabeledFieldView(locale, createLabeledInputText);
        urlInputView.bind('label').to(this, 'isImageSelected', value => value ? t('Update image URL') : t('Insert image via URL'));
        urlInputView.bind('isEnabled').to(this);
        urlInputView.fieldView.inputMode = 'url';
        urlInputView.fieldView.placeholder = 'https://example.com/image.png';
        urlInputView.fieldView.bind('value').to(this, 'imageURLInputValue', (value) => value || '');
        urlInputView.fieldView.on('input', () => {
            this.imageURLInputValue = urlInputView.fieldView.element.value.trim();
        });
        return urlInputView;
    }
    /**
     * Focuses the view.
     */
    focus() {
        this.urlInputView.focus();
    }
}
