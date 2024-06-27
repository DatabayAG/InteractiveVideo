/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/clickobserver
 */
import DomEventObserver from './domeventobserver.js';
/**
 * {@link module:engine/view/document~Document#event:click Click} event observer.
 *
 * Note that this observer is not available by default. To make it available it needs to be added to
 * {@link module:engine/view/view~View view controller} by a {@link module:engine/view/view~View#addObserver} method.
 */
export default class ClickObserver extends DomEventObserver {
    constructor() {
        super(...arguments);
        /**
         * @inheritDoc
         */
        this.domEventType = 'click';
    }
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent) {
        this.fire(domEvent.type, domEvent);
    }
}
