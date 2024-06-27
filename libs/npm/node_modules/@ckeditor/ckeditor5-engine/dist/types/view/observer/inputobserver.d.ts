/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/inputobserver
 */
import DomEventObserver from './domeventobserver.js';
import type DomEventData from './domeventdata.js';
import type ViewRange from '../range.js';
import DataTransfer from '../datatransfer.js';
/**
 * Observer for events connected with data input.
 *
 * **Note**: This observer is attached by {@link module:engine/view/view~View} and available by default in all
 * editor instances.
 */
export default class InputObserver extends DomEventObserver<'beforeinput'> {
    /**
     * @inheritDoc
     */
    readonly domEventType: "beforeinput";
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent: InputEvent): void;
}
/**
 * Fired before the web browser inputs, deletes, or formats some data.
 *
 * This event is introduced by {@link module:engine/view/observer/inputobserver~InputObserver} and available
 * by default in all editor instances (attached by {@link module:engine/view/view~View}).
 *
 * @see module:engine/view/observer/inputobserver~InputObserver
 * @eventName module:engine/view/document~Document#beforeinput
 * @param data Event data containing detailed information about the event.
 */
export type ViewDocumentInputEvent = {
    name: 'beforeinput';
    args: [data: InputEventData];
};
/**
 * The value of the {@link ~ViewDocumentInputEvent} event.
 */
export interface InputEventData extends DomEventData<InputEvent> {
    /**
     * The type of the input event (e.g. "insertText" or "deleteWordBackward"). Corresponds to native `InputEvent#inputType`.
     */
    readonly inputType: string;
    /**
     * A unified text data passed along with the input event. Depending on:
     *
     * * the web browser and input events implementation (for instance [Level 1](https://www.w3.org/TR/input-events-1/) or
     * [Level 2](https://www.w3.org/TR/input-events-2/)),
     * * {@link module:engine/view/observer/inputobserver~InputEventData#inputType input type}
     *
     * text data is sometimes passed in the `data` and sometimes in the `dataTransfer` property.
     *
     * * If `InputEvent#data` was set, this property reflects its value.
     * * If `InputEvent#data` is unavailable, this property contains the `'text/plain'` data from
     * {@link module:engine/view/observer/inputobserver~InputEventData#dataTransfer}.
     * * If the event ({@link module:engine/view/observer/inputobserver~InputEventData#inputType input type})
     * provides no data whatsoever, this property is `null`.
     */
    readonly data: string | null;
    /**
     * The data transfer instance of the input event. Corresponds to native `InputEvent#dataTransfer`.
     *
     * The value is `null` when no `dataTransfer` was passed along with the input event.
     */
    readonly dataTransfer: DataTransfer;
    /**
     * A flag indicating that the `beforeinput` event was fired during composition.
     *
     * Corresponds to the
     * {@link module:engine/view/document~Document#event:compositionstart},
     * {@link module:engine/view/document~Document#event:compositionupdate},
     * and {@link module:engine/view/document~Document#event:compositionend } trio.
     */
    readonly isComposing: boolean;
    /**
     * Editing {@link module:engine/view/range~Range view ranges} corresponding to DOM ranges provided by the web browser
     * (as returned by `InputEvent#getTargetRanges()`).
     */
    readonly targetRanges: Array<ViewRange>;
}
