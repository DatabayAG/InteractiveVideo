/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/compositionobserver
 */
import DomEventObserver from './domeventobserver.js';
import type View from '../view.js';
import type DomEventData from './domeventdata.js';
/**
 * {@link module:engine/view/document~Document#event:compositionstart Compositionstart},
 * {@link module:engine/view/document~Document#event:compositionupdate compositionupdate} and
 * {@link module:engine/view/document~Document#event:compositionend compositionend} events observer.
 *
 * Note that this observer is attached by the {@link module:engine/view/view~View} and is available by default.
 */
export default class CompositionObserver extends DomEventObserver<'compositionstart' | 'compositionupdate' | 'compositionend'> {
    /**
     * @inheritDoc
     */
    readonly domEventType: readonly ["compositionstart", "compositionupdate", "compositionend"];
    /**
     * @inheritDoc
     */
    constructor(view: View);
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent: CompositionEvent): void;
}
export interface CompositionEventData extends DomEventData<CompositionEvent> {
    data: string | null;
}
/**
 * Fired when composition starts inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/view~View} this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @eventName module:engine/view/document~Document#compositionstart
 * @param data Event data.
 */
export type ViewDocumentCompositionStartEvent = {
    name: 'compositionstart';
    args: [data: CompositionEventData];
};
/**
 * Fired when composition is updated inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/view~View} this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @eventName module:engine/view/document~Document#compositionupdate
 * @param data Event data.
 */
export type ViewDocumentCompositionUpdateEvent = {
    name: 'compositionupdate';
    args: [data: CompositionEventData];
};
/**
 * Fired when composition ends inside one of the editables.
 *
 * Introduced by {@link module:engine/view/observer/compositionobserver~CompositionObserver}.
 *
 * Note that because {@link module:engine/view/observer/compositionobserver~CompositionObserver} is attached by the
 * {@link module:engine/view/view~View} this event is available by default.
 *
 * @see module:engine/view/observer/compositionobserver~CompositionObserver
 * @eventName module:engine/view/document~Document#compositionend
 * @param data Event data.
 */
export type ViewDocumentCompositionEndEvent = {
    name: 'compositionend';
    args: [data: CompositionEventData];
};
