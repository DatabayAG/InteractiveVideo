/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/bubblingeventinfo
 */
import { EventInfo } from '@ckeditor/ckeditor5-utils';
import type Document from '../document.js';
import type Node from '../node.js';
import type Range from '../range.js';
/**
 * The event object passed to bubbling event callbacks. It is used to provide information about the event as well as a tool to
 * manipulate it.
 */
export default class BubblingEventInfo<TName extends string = string, TReturn = unknown> extends EventInfo<TName, TReturn> {
    /**
     * The view range that the bubbling should start from.
     */
    readonly startRange: Range;
    /**
     * The current event phase.
     */
    private _eventPhase;
    /**
     * The current bubbling target.
     */
    private _currentTarget;
    /**
     * @param source The emitter.
     * @param name The event name.
     * @param startRange The view range that the bubbling should start from.
     */
    constructor(source: object, name: TName, startRange: Range);
    /**
     * The current event phase.
     */
    get eventPhase(): EventPhase;
    /**
     * The current bubbling target.
     */
    get currentTarget(): Document | Node | null;
}
/**
 * The phase the event is in.
 */
export type EventPhase = 'none' | 'capturing' | 'atTarget' | 'bubbling';
