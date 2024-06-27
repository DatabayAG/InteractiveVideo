/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/focuscycler
 */
import { isVisible, EmitterMixin } from '@ckeditor/ckeditor5-utils';
/**
 * A utility class that helps cycling over {@link module:ui/focuscycler~FocusableView focusable views} in a
 * {@link module:ui/viewcollection~ViewCollection} when the focus is tracked by the
 * {@link module:utils/focustracker~FocusTracker} instance. It helps implementing keyboard
 * navigation in HTML forms, toolbars, lists and the like.
 *
 * To work properly it requires:
 * * a collection of focusable (HTML `tabindex` attribute) views that implement the `focus()` method,
 * * an associated focus tracker to determine which view is focused.
 *
 * A simple cycler setup can look like this:
 *
 * ```ts
 * const focusables = new ViewCollection<FocusableView>();
 * const focusTracker = new FocusTracker();
 *
 * // Add focusable views to the focus tracker.
 * focusTracker.add( ... );
 * ```
 *
 * Then, the cycler can be used manually:
 *
 * ```ts
 * const cycler = new FocusCycler( { focusables, focusTracker } );
 *
 * // Will focus the first focusable view in #focusables.
 * cycler.focusFirst();
 *
 * // Will log the next focusable item in #focusables.
 * console.log( cycler.next );
 * ```
 *
 * Alternatively, it can work side by side with the {@link module:utils/keystrokehandler~KeystrokeHandler}:
 *
 * ```ts
 * const keystrokeHandler = new KeystrokeHandler();
 *
 * // Activate the keystroke handler.
 * keystrokeHandler.listenTo( sourceOfEvents );
 *
 * const cycler = new FocusCycler( {
 * 	focusables, focusTracker, keystrokeHandler,
 * 	actions: {
 * 		// When arrowup of arrowleft is detected by the #keystrokeHandler,
 * 		// focusPrevious() will be called on the cycler.
 * 		focusPrevious: [ 'arrowup', 'arrowleft' ],
 * 	}
 * } );
 * ```
 *
 * Check out the {@glink framework/deep-dive/ui/focus-tracking "Deep dive into focus tracking"} guide to learn more.
 */
export default class FocusCycler extends /* #__PURE__ */ EmitterMixin() {
    /**
     * Creates an instance of the focus cycler utility.
     *
     * @param options Configuration options.
     */
    constructor(options) {
        super();
        this.focusables = options.focusables;
        this.focusTracker = options.focusTracker;
        this.keystrokeHandler = options.keystrokeHandler;
        this.actions = options.actions;
        if (options.actions && options.keystrokeHandler) {
            for (const methodName in options.actions) {
                let actions = options.actions[methodName];
                if (typeof actions == 'string') {
                    actions = [actions];
                }
                for (const keystroke of actions) {
                    options.keystrokeHandler.set(keystroke, (data, cancel) => {
                        this[methodName]();
                        cancel();
                    });
                }
            }
        }
        this.on('forwardCycle', () => this.focusFirst(), { priority: 'low' });
        this.on('backwardCycle', () => this.focusLast(), { priority: 'low' });
    }
    /**
     * Returns the first focusable view in {@link #focusables}.
     * Returns `null` if there is none.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    get first() {
        return (this.focusables.find(isDomFocusable) || null);
    }
    /**
     * Returns the last focusable view in {@link #focusables}.
     * Returns `null` if there is none.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    get last() {
        return (this.focusables.filter(isDomFocusable).slice(-1)[0] || null);
    }
    /**
     * Returns the next focusable view in {@link #focusables} based on {@link #current}.
     * Returns `null` if there is none.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    get next() {
        return this._getDomFocusableItem(1);
    }
    /**
     * Returns the previous focusable view in {@link #focusables} based on {@link #current}.
     * Returns `null` if there is none.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    get previous() {
        return this._getDomFocusableItem(-1);
    }
    /**
     * An index of the view in the {@link #focusables} which is focused according
     * to {@link #focusTracker}. Returns `null` when there is no such view.
     */
    get current() {
        let index = null;
        // There's no focused view in the focusables.
        if (this.focusTracker.focusedElement === null) {
            return null;
        }
        this.focusables.find((view, viewIndex) => {
            const focused = view.element === this.focusTracker.focusedElement;
            if (focused) {
                index = viewIndex;
            }
            return focused;
        });
        return index;
    }
    /**
     * Focuses the {@link #first} item in {@link #focusables}.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    focusFirst() {
        this._focus(this.first, 1);
    }
    /**
     * Focuses the {@link #last} item in {@link #focusables}.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    focusLast() {
        this._focus(this.last, -1);
    }
    /**
     * Focuses the {@link #next} item in {@link #focusables}.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    focusNext() {
        const next = this.next;
        // If there's only one focusable item, we need to let the outside world know
        // that the next cycle is about to happen. This may be useful
        // e.g. if you want to move the focus to the parent focus cycler.
        // Note that the focus is not actually moved in this case.
        if (next && this.focusables.getIndex(next) === this.current) {
            this.fire('forwardCycle');
            return;
        }
        if (next === this.first) {
            this.fire('forwardCycle');
        }
        else {
            this._focus(next, 1);
        }
    }
    /**
     * Focuses the {@link #previous} item in {@link #focusables}.
     *
     * **Note**: Hidden views (e.g. with `display: none`) are ignored.
     */
    focusPrevious() {
        const previous = this.previous;
        if (previous && this.focusables.getIndex(previous) === this.current) {
            this.fire('backwardCycle');
            return;
        }
        if (previous === this.last) {
            this.fire('backwardCycle');
        }
        else {
            this._focus(previous, -1);
        }
    }
    /**
     * Focuses the given view if it exists.
     *
     * @param view The view to be focused
     * @param direction The direction of the focus if the view has focusable children.
     * @returns
     */
    _focus(view, direction) {
        // Don't fire focus events if the view is already focused.
        // Such attempt may occur when cycling with only one focusable item:
        // even though `focusNext()` method returns without changing focus,
        // the `forwardCycle` event is fired, triggering the `focusFirst()` method.
        if (view && this.focusTracker.focusedElement !== view.element) {
            view.focus(direction);
        }
    }
    /**
     * Returns the next or previous focusable view in {@link #focusables} with respect
     * to {@link #current}.
     *
     * @param step Either `1` for checking forward from {@link #current} or `-1` for checking backwards.
     */
    _getDomFocusableItem(step) {
        // Cache for speed.
        const collectionLength = this.focusables.length;
        if (!collectionLength) {
            return null;
        }
        const current = this.current;
        // Start from the beginning if no view is focused.
        // https://github.com/ckeditor/ckeditor5-ui/issues/206
        if (current === null) {
            return this[step === 1 ? 'first' : 'last'];
        }
        // Note: If current is the only focusable view, it will also be returned for the given step.
        let focusableItem = this.focusables.get(current);
        // Cycle in both directions.
        let index = (current + collectionLength + step) % collectionLength;
        do {
            const focusableItemCandidate = this.focusables.get(index);
            if (isDomFocusable(focusableItemCandidate)) {
                focusableItem = focusableItemCandidate;
                break;
            }
            // Cycle in both directions.
            index = (index + collectionLength + step) % collectionLength;
        } while (index !== current);
        return focusableItem;
    }
}
/**
 * Checks whether a view can be focused (has `focus()` method and is visible).
 *
 * @param view A view to be checked.
 */
function isDomFocusable(view) {
    return isFocusable(view) && isVisible(view.element);
}
/**
 * Checks whether a view is {@link ~FocusableView}.
 *
 * @param view A view to be checked.
 */
export function isFocusable(view) {
    return !!('focus' in view && typeof view.focus == 'function');
}
/**
 * Checks whether a view is an instance of {@link ~ViewWithFocusCycler}.
 *
 * @param view A view to be checked.
 */
export function isViewWithFocusCycler(view) {
    return isFocusable(view) && 'focusCycler' in view && view.focusCycler instanceof FocusCycler;
}
