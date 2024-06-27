/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/editableui/editableuiview
 */
import View from '../view.js';
/**
 * The editable UI view class.
 */
export default class EditableUIView extends View {
    /**
     * Creates an instance of EditableUIView class.
     *
     * @param locale The locale instance.
     * @param editingView The editing view instance the editable is related to.
     * @param editableElement The editable element. If not specified, this view
     * should create it. Otherwise, the existing element should be used.
     */
    constructor(locale, editingView, editableElement) {
        super(locale);
        /**
         * The name of the editable UI view.
         */
        this.name = null;
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-content',
                    'ck-editor__editable',
                    'ck-rounded-corners'
                ],
                lang: locale.contentLanguage,
                dir: locale.contentLanguageDirection
            }
        });
        this.set('isFocused', false);
        this._editableElement = editableElement;
        this._hasExternalElement = !!this._editableElement;
        this._editingView = editingView;
    }
    /**
     * Renders the view by either applying the {@link #template} to the existing
     * {@link module:ui/editableui/editableuiview~EditableUIView#_editableElement} or assigning {@link #element}
     * as {@link module:ui/editableui/editableuiview~EditableUIView#_editableElement}.
     */
    render() {
        super.render();
        if (this._hasExternalElement) {
            this.template.apply(this.element = this._editableElement);
        }
        else {
            this._editableElement = this.element;
        }
        this.on('change:isFocused', () => this._updateIsFocusedClasses());
        this._updateIsFocusedClasses();
    }
    /**
     * @inheritDoc
     */
    destroy() {
        if (this._hasExternalElement) {
            this.template.revert(this._editableElement);
        }
        super.destroy();
    }
    /**
     * Whether an external {@link #_editableElement} was passed into the constructor, which also means
     * the view will not render its {@link #template}.
     */
    get hasExternalElement() {
        return this._hasExternalElement;
    }
    /**
     * Updates the `ck-focused` and `ck-blurred` CSS classes on the {@link #element} according to
     * the {@link #isFocused} property value using the {@link #_editingView editing view} API.
     */
    _updateIsFocusedClasses() {
        const editingView = this._editingView;
        if (editingView.isRenderingInProgress) {
            updateAfterRender(this);
        }
        else {
            update(this);
        }
        function update(view) {
            editingView.change(writer => {
                const viewRoot = editingView.document.getRoot(view.name);
                writer.addClass(view.isFocused ? 'ck-focused' : 'ck-blurred', viewRoot);
                writer.removeClass(view.isFocused ? 'ck-blurred' : 'ck-focused', viewRoot);
            });
        }
        // In a case of a multi-root editor, a callback will be attached more than once (one callback for each root).
        // While executing one callback the `isRenderingInProgress` observable is changing what causes executing another
        // callback and render is called inside the already pending render.
        // We need to be sure that callback is executed only when the value has changed from `true` to `false`.
        // See https://github.com/ckeditor/ckeditor5/issues/1676.
        function updateAfterRender(view) {
            editingView.once('change:isRenderingInProgress', (evt, name, value) => {
                if (!value) {
                    update(view);
                }
                else {
                    updateAfterRender(view);
                }
            });
        }
    }
}
