/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/* global setTimeout, clearTimeout */
/**
 * @module utils/focustracker
 */
import DomEmitterMixin from './dom/emittermixin.js';
import ObservableMixin from './observablemixin.js';
import CKEditorError from './ckeditorerror.js';
/**
 * Allows observing a group of `Element`s whether at least one of them is focused.
 *
 * Used by the {@link module:core/editor/editor~Editor} in order to track whether the focus is still within the application,
 * or were used outside of its UI.
 *
 * **Note** `focus` and `blur` listeners use event capturing, so it is only needed to register wrapper `Element`
 * which contain other `focusable` elements. But note that this wrapper element has to be focusable too
 * (have e.g. `tabindex="-1"`).
 *
 * Check out the {@glink framework/deep-dive/ui/focus-tracking "Deep dive into focus tracking"} guide to learn more.
 */
export default class FocusTracker extends /* #__PURE__ */ DomEmitterMixin(/* #__PURE__ */ ObservableMixin()) {
    constructor() {
        super();
        /**
         * List of registered elements.
         *
         * @internal
         */
        this._elements = new Set();
        /**
         * Event loop timeout.
         */
        this._nextEventLoopTimeout = null;
        this.set('isFocused', false);
        this.set('focusedElement', null);
    }
    /**
     * Starts tracking the specified element.
     */
    add(element) {
        if (this._elements.has(element)) {
            /**
             * This element is already tracked by {@link module:utils/focustracker~FocusTracker}.
             *
             * @error focustracker-add-element-already-exist
             */
            throw new CKEditorError('focustracker-add-element-already-exist', this);
        }
        this.listenTo(element, 'focus', () => this._focus(element), { useCapture: true });
        this.listenTo(element, 'blur', () => this._blur(), { useCapture: true });
        this._elements.add(element);
    }
    /**
     * Stops tracking the specified element and stops listening on this element.
     */
    remove(element) {
        if (element === this.focusedElement) {
            this._blur();
        }
        if (this._elements.has(element)) {
            this.stopListening(element);
            this._elements.delete(element);
        }
    }
    /**
     * Destroys the focus tracker by:
     * - Disabling all event listeners attached to tracked elements.
     * - Removing all tracked elements that were previously added.
     */
    destroy() {
        this.stopListening();
    }
    /**
     * Stores currently focused element and set {@link #isFocused} as `true`.
     */
    _focus(element) {
        clearTimeout(this._nextEventLoopTimeout);
        this.focusedElement = element;
        this.isFocused = true;
    }
    /**
     * Clears currently focused element and set {@link #isFocused} as `false`.
     * This method uses `setTimeout` to change order of fires `blur` and `focus` events.
     */
    _blur() {
        clearTimeout(this._nextEventLoopTimeout);
        this._nextEventLoopTimeout = setTimeout(() => {
            this.focusedElement = null;
            this.isFocused = false;
        }, 0);
    }
}
