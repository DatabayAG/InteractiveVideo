/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/fakeselectionobserver
 */
import Observer from './observer.js';
import type View from '../view.js';
/**
 * Fake selection observer class. If view selection is fake it is placed in dummy DOM container. This observer listens
 * on {@link module:engine/view/document~Document#event:keydown keydown} events and handles moving fake view selection to the correct place
 * if arrow keys are pressed.
 * Fires {@link module:engine/view/document~Document#event:selectionChange selectionChange event} simulating natural behaviour of
 * {@link module:engine/view/observer/selectionobserver~SelectionObserver SelectionObserver}.
 */
export default class FakeSelectionObserver extends Observer {
    /**
     * Fires debounced event `selectionChangeDone`. It uses `lodash#debounce` method to delay function call.
     */
    private readonly _fireSelectionChangeDoneDebounced;
    /**
     * Creates new FakeSelectionObserver instance.
     */
    constructor(view: View);
    /**
     * @inheritDoc
     */
    observe(): void;
    /**
     * @inheritDoc
     */
    stopObserving(): void;
    /**
     * @inheritDoc
     */
    destroy(): void;
    /**
     * Handles collapsing view selection according to given key code. If left or up key is provided - new selection will be
     * collapsed to left. If right or down key is pressed - new selection will be collapsed to right.
     *
     * This method fires {@link module:engine/view/document~Document#event:selectionChange} and
     * {@link module:engine/view/document~Document#event:selectionChangeDone} events imitating behaviour of
     * {@link module:engine/view/observer/selectionobserver~SelectionObserver}.
     */
    private _handleSelectionMove;
}
