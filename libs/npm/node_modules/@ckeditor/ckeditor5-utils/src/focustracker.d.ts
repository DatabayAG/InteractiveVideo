/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
declare const FocusTracker_base: import("./mix.js").Mixed<{
    new (): import("./observablemixin.js").Observable;
    prototype: import("./observablemixin.js").Observable;
}, import("./dom/emittermixin.js").DomEmitter>;
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
export default class FocusTracker extends /* #__PURE__ */ FocusTracker_base {
    /**
     * True when one of the registered elements is focused.
     *
     * @readonly
     * @observable
     */
    isFocused: boolean;
    /**
     * The currently focused element.
     *
     * While {@link #isFocused `isFocused`} remains `true`, the focus can
     * move between different UI elements. This property tracks those
     * elements and tells which one is currently focused.
     *
     * @readonly
     * @observable
     */
    focusedElement: Element | null;
    /**
     * List of registered elements.
     *
     * @internal
     */
    _elements: Set<Element>;
    /**
     * Event loop timeout.
     */
    private _nextEventLoopTimeout;
    constructor();
    /**
     * Starts tracking the specified element.
     */
    add(element: Element): void;
    /**
     * Stops tracking the specified element and stops listening on this element.
     */
    remove(element: Element): void;
    /**
     * Destroys the focus tracker by:
     * - Disabling all event listeners attached to tracked elements.
     * - Removing all tracked elements that were previously added.
     */
    destroy(): void;
    /**
     * Stores currently focused element and set {@link #isFocused} as `true`.
     */
    private _focus;
    /**
     * Clears currently focused element and set {@link #isFocused} as `false`.
     * This method uses `setTimeout` to change order of fires `blur` and `focus` events.
     */
    private _blur;
}
export {};
