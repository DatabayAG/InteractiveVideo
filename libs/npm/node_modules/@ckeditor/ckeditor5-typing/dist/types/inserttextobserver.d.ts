/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { DomEventData, Observer, FocusObserver, type EditingView, type ViewDocumentSelection, type ViewRange, type ViewSelection } from '@ckeditor/ckeditor5-engine';
/**
 * Text insertion observer introduces the {@link module:engine/view/document~Document#event:insertText} event.
 */
export default class InsertTextObserver extends Observer {
    /**
     * Instance of the focus observer. Insert text observer calls
     * {@link module:engine/view/observer/focusobserver~FocusObserver#flush} to mark the latest focus change as complete.
     */
    readonly focusObserver: FocusObserver;
    /**
     * @inheritDoc
     */
    constructor(view: EditingView);
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
 * Event fired when the user types text, for instance presses <kbd>A</kbd> or <kbd>?</kbd> in the
 * editing view document.
 *
 * **Note**: This event will **not** fire for keystrokes such as <kbd>Delete</kbd> or <kbd>Enter</kbd>.
 * They have dedicated events, see {@link module:engine/view/document~Document#event:delete} and
 * {@link module:engine/view/document~Document#event:enter} to learn more.
 *
 * **Note**: This event is fired by the {@link module:typing/inserttextobserver~InsertTextObserver input feature}.
 *
 * @eventName module:engine/view/document~Document#insertText
 * @param data The event data.
 */
export type ViewDocumentInsertTextEvent = {
    name: 'insertText';
    args: [data: InsertTextEventData];
};
export interface InsertTextEventData extends DomEventData {
    /**
     *  The text to be inserted.
     */
    text: string;
    /**
     * The selection into which the text should be inserted.
     * If not specified, the insertion should occur at the current view selection.
     */
    selection: ViewSelection | ViewDocumentSelection;
    /**
     * The range that view selection should be set to after insertion.
     */
    resultRange?: ViewRange;
}
