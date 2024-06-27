/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/arrowkeysobserver
 */
import Observer from './observer.js';
import BubblingEventInfo from './bubblingeventinfo.js';
import { isArrowKeyCode } from '@ckeditor/ckeditor5-utils';
/**
 * Arrow keys observer introduces the {@link module:engine/view/document~Document#event:arrowKey `Document#arrowKey`} event.
 *
 * Note that this observer is attached by the {@link module:engine/view/view~View} and is available by default.
 */
export default class ArrowKeysObserver extends Observer {
    /**
     * @inheritDoc
     */
    constructor(view) {
        super(view);
        this.document.on('keydown', (event, data) => {
            if (this.isEnabled && isArrowKeyCode(data.keyCode)) {
                const eventInfo = new BubblingEventInfo(this.document, 'arrowKey', this.document.selection.getFirstRange());
                this.document.fire(eventInfo, data);
                if (eventInfo.stop.called) {
                    event.stop();
                }
            }
        });
    }
    /**
     * @inheritDoc
     */
    observe() { }
    /**
     * @inheritDoc
     */
    stopObserving() { }
}
