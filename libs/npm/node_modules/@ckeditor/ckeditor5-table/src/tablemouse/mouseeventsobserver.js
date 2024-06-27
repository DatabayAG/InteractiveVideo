/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/tablemouse/mouseeventsobserver
 */
import { DomEventObserver } from 'ckeditor5/src/engine.js';
/**
 * The mouse selection event observer.
 *
 * It registers listeners for the following DOM events:
 *
 * - `'mousemove'`
 * - `'mouseleave'`
 *
 * Note that this observer is disabled by default. To enable this observer, it needs to be added to
 * {@link module:engine/view/view~View} using the {@link module:engine/view/view~View#addObserver} method.
 *
 * The observer is registered by the {@link module:table/tableselection~TableSelection} plugin.
 */
export default class MouseEventsObserver extends DomEventObserver {
    constructor() {
        super(...arguments);
        this.domEventType = [
            'mousemove', 'mouseleave'
        ];
    }
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent) {
        this.fire(domEvent.type, domEvent);
    }
}
