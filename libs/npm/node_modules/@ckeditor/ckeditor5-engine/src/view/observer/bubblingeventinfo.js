/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/bubblingeventinfo
 */
import { EventInfo } from '@ckeditor/ckeditor5-utils';
/**
 * The event object passed to bubbling event callbacks. It is used to provide information about the event as well as a tool to
 * manipulate it.
 */
export default class BubblingEventInfo extends EventInfo {
    /**
     * @param source The emitter.
     * @param name The event name.
     * @param startRange The view range that the bubbling should start from.
     */
    constructor(source, name, startRange) {
        super(source, name);
        this.startRange = startRange;
        this._eventPhase = 'none';
        this._currentTarget = null;
    }
    /**
     * The current event phase.
     */
    get eventPhase() {
        return this._eventPhase;
    }
    /**
     * The current bubbling target.
     */
    get currentTarget() {
        return this._currentTarget;
    }
}
