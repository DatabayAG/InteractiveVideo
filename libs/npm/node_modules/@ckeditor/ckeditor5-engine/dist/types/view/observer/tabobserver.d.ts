/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/tabobserver
 */
import type View from '../view.js';
import Observer from './observer.js';
import type { KeyEventData } from './keyobserver.js';
import type { BubblingEvent } from './bubblingemittermixin.js';
/**
 * Tab observer introduces the {@link module:engine/view/document~Document#event:tab `Document#tab`} event.
 *
 * Note that because {@link module:engine/view/observer/tabobserver~TabObserver} is attached by the
 * {@link module:engine/view/view~View}, this event is available by default.
 */
export default class TabObserver extends Observer {
    /**
     * @inheritDoc
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
}
/**
 * Event fired when the user presses a tab key.
 *
 * Introduced by {@link module:engine/view/observer/tabobserver~TabObserver}.
 *
 * Note that because {@link module:engine/view/observer/tabobserver~TabObserver} is attached by the
 * {@link module:engine/view/view~View}, this event is available by default.
 *
 * @eventName module:engine/view/document~Document#tab
 * @param data
 */
export type ViewDocumentTabEvent = BubblingEvent<{
    name: 'tab';
    args: [data: KeyEventData];
}>;
