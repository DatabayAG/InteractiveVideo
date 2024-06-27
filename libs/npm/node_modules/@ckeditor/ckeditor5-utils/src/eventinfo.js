/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module utils/eventinfo
 */
import spy from './spy.js';
/**
 * The event object passed to event callbacks. It is used to provide information about the event as well as a tool to
 * manipulate it.
 */
export default class EventInfo {
    /**
     * @param source The emitter.
     * @param name The event name.
     */
    constructor(source, name) {
        this.source = source;
        this.name = name;
        this.path = [];
        // The following methods are defined in the constructor because they must be re-created per instance.
        this.stop = spy();
        this.off = spy();
    }
}
