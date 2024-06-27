/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/domeventobserver
 */
import Observer from './observer.js';
import DomEventData from './domeventdata.js';
/**
 * Base class for DOM event observers. This class handles
 * {@link module:engine/view/observer/observer~Observer#observe adding} listeners to DOM elements,
 * {@link module:engine/view/observer/observer~Observer#disable disabling} and
 * {@link module:engine/view/observer/observer~Observer#enable re-enabling} events.
 * Child class needs to define
 * {@link module:engine/view/observer/domeventobserver~DomEventObserver#domEventType DOM event type} and
 * {@link module:engine/view/observer/domeventobserver~DomEventObserver#onDomEvent callback}.
 *
 * For instance:
 *
 * ```ts
 * class ClickObserver extends DomEventObserver<'click'> {
 * 	// It can also be defined as a normal property in the constructor.
 * 	get domEventType(): 'click' {
 * 		return 'click';
 * 	}
 *
 * 	onDomEvent( domEvent: MouseEvent ): void {
 * 		this.fire( 'click', domEvent );
 * 	}
 * }
 * ```
 *
 * @typeParam EventType DOM Event type name or an union of those.
 * @typeParam AdditionalData Additional data passed along with the event.
 */
export default class DomEventObserver extends Observer {
    constructor() {
        super(...arguments);
        /**
         * If set to `true` DOM events will be listened on the capturing phase.
         * Default value is `false`.
         */
        this.useCapture = false;
    }
    /**
     * @inheritDoc
     */
    observe(domElement) {
        const types = typeof this.domEventType == 'string' ? [this.domEventType] : this.domEventType;
        types.forEach(type => {
            this.listenTo(domElement, type, (eventInfo, domEvent) => {
                if (this.isEnabled && !this.checkShouldIgnoreEventFromTarget(domEvent.target)) {
                    this.onDomEvent(domEvent);
                }
            }, { useCapture: this.useCapture });
        });
    }
    /**
     * @inheritDoc
     */
    stopObserving(domElement) {
        this.stopListening(domElement);
    }
    /**
     * Calls `Document#fire()` if observer {@link #isEnabled is enabled}.
     *
     * @see module:utils/emittermixin~Emitter#fire
     * @param eventType The event type (name).
     * @param domEvent The DOM event.
     * @param additionalData The additional data which should extend the
     * {@link module:engine/view/observer/domeventdata~DomEventData event data} object.
     */
    fire(eventType, domEvent, additionalData) {
        if (this.isEnabled) {
            this.document.fire(eventType, new DomEventData(this.view, domEvent, additionalData));
        }
    }
}
