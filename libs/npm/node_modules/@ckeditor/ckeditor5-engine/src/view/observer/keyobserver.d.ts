/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/keyobserver
 */
import DomEventObserver from './domeventobserver.js';
import type DomEventData from './domeventdata.js';
import { type KeystrokeInfo } from '@ckeditor/ckeditor5-utils';
/**
 * Observer for events connected with pressing keyboard keys.
 *
 * Note that this observer is attached by the {@link module:engine/view/view~View} and is available by default.
 */
export default class KeyObserver extends DomEventObserver<'keydown' | 'keyup', KeystrokeInfo & {
    keystroke: number;
}> {
    /**
     * @inheritDoc
     */
    readonly domEventType: readonly ["keydown", "keyup"];
    /**
     * @inheritDoc
     */
    onDomEvent(domEvt: KeyboardEvent): void;
}
/**
 * Fired when a key has been pressed.
 *
 * Introduced by {@link module:engine/view/observer/keyobserver~KeyObserver}.
 *
 * Note that because {@link module:engine/view/observer/keyobserver~KeyObserver} is attached by the
 * {@link module:engine/view/view~View} this event is available by default.
 *
 * @see module:engine/view/observer/keyobserver~KeyObserver
 * @eventName module:engine/view/document~Document#keydown
 */
export type ViewDocumentKeyDownEvent = {
    name: 'keydown';
    args: [data: KeyEventData];
};
/**
 * Fired when a key has been released.
 *
 * Introduced by {@link module:engine/view/observer/keyobserver~KeyObserver}.
 *
 * Note that because {@link module:engine/view/observer/keyobserver~KeyObserver} is attached by the
 * {@link module:engine/view/view~View} this event is available by default.
 *
 * @see module:engine/view/observer/keyobserver~KeyObserver
 * @eventName module:engine/view/document~Document#keyup
 */
export type ViewDocumentKeyUpEvent = {
    name: 'keyup';
    args: [data: KeyEventData];
};
/**
 * The value of both events - {@link ~ViewDocumentKeyDownEvent} and {@link ~ViewDocumentKeyUpEvent}.
 */
export interface KeyEventData extends DomEventData<KeyboardEvent>, KeystrokeInfo {
    /**
     * Code of the whole keystroke. See {@link module:utils/keyboard~getCode}.
     */
    keystroke: number;
}
