/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/bubblingemittermixin
 */
import { CKEditorError, EmitterMixin, EventInfo, toArray } from '@ckeditor/ckeditor5-utils';
import BubblingEventInfo from './bubblingeventinfo.js';
const contextsSymbol = Symbol('bubbling contexts');
/**
 * Bubbling emitter mixin for the view document as described in the {@link ~BubblingEmitter} interface.
 *
 * This function creates a class that inherits from the provided `base` and implements `Emitter` interface.
 * The base class must implement {@link module:utils/emittermixin~Emitter} interface.
 *
 * ```ts
 * class BaseClass extends EmitterMixin() {
 * 	// ...
 * }
 *
 * class MyClass extends BubblingEmitterMixin( BaseClass ) {
 * 	// This class derives from `BaseClass` and implements the `BubblingEmitter` interface.
 * }
 * ```
 */
export default function BubblingEmitterMixin(base) {
    class Mixin extends base {
        fire(eventOrInfo, ...eventArgs) {
            try {
                const eventInfo = eventOrInfo instanceof EventInfo ? eventOrInfo : new EventInfo(this, eventOrInfo);
                const eventContexts = getBubblingContexts(this);
                if (!eventContexts.size) {
                    return;
                }
                updateEventInfo(eventInfo, 'capturing', this);
                // The capture phase of the event.
                if (fireListenerFor(eventContexts, '$capture', eventInfo, ...eventArgs)) {
                    return eventInfo.return;
                }
                const startRange = eventInfo.startRange || this.selection.getFirstRange();
                const selectedElement = startRange ? startRange.getContainedElement() : null;
                const isCustomContext = selectedElement ? Boolean(getCustomContext(eventContexts, selectedElement)) : false;
                let node = selectedElement || getDeeperRangeParent(startRange);
                updateEventInfo(eventInfo, 'atTarget', node);
                // For the not yet bubbling event trigger for $text node if selection can be there and it's not a custom context selected.
                if (!isCustomContext) {
                    if (fireListenerFor(eventContexts, '$text', eventInfo, ...eventArgs)) {
                        return eventInfo.return;
                    }
                    updateEventInfo(eventInfo, 'bubbling', node);
                }
                while (node) {
                    // Root node handling.
                    if (node.is('rootElement')) {
                        if (fireListenerFor(eventContexts, '$root', eventInfo, ...eventArgs)) {
                            return eventInfo.return;
                        }
                    }
                    // Element node handling.
                    else if (node.is('element')) {
                        if (fireListenerFor(eventContexts, node.name, eventInfo, ...eventArgs)) {
                            return eventInfo.return;
                        }
                    }
                    // Check custom contexts (i.e., a widget).
                    if (fireListenerFor(eventContexts, node, eventInfo, ...eventArgs)) {
                        return eventInfo.return;
                    }
                    node = node.parent;
                    updateEventInfo(eventInfo, 'bubbling', node);
                }
                updateEventInfo(eventInfo, 'bubbling', this);
                // Document context.
                fireListenerFor(eventContexts, '$document', eventInfo, ...eventArgs);
                return eventInfo.return;
            }
            catch (err) {
                // @if CK_DEBUG // throw err;
                /* istanbul ignore next -- @preserve */
                CKEditorError.rethrowUnexpectedError(err, this);
            }
        }
        _addEventListener(event, callback, options) {
            const contexts = toArray(options.context || '$document');
            const eventContexts = getBubblingContexts(this);
            for (const context of contexts) {
                let emitter = eventContexts.get(context);
                if (!emitter) {
                    emitter = new (EmitterMixin())();
                    eventContexts.set(context, emitter);
                }
                this.listenTo(emitter, event, callback, options);
            }
        }
        _removeEventListener(event, callback) {
            const eventContexts = getBubblingContexts(this);
            for (const emitter of eventContexts.values()) {
                this.stopListening(emitter, event, callback);
            }
        }
    }
    return Mixin;
}
// Backward compatibility with `mix`.
{
    const mixin = BubblingEmitterMixin(Object);
    ['fire', '_addEventListener', '_removeEventListener'].forEach(key => {
        BubblingEmitterMixin[key] = mixin.prototype[key];
    });
}
/**
 * Update the event info bubbling fields.
 *
 * @param eventInfo The event info object to update.
 * @param eventPhase The current event phase.
 * @param currentTarget The current bubbling target.
 */
function updateEventInfo(eventInfo, eventPhase, currentTarget) {
    if (eventInfo instanceof BubblingEventInfo) {
        eventInfo._eventPhase = eventPhase;
        eventInfo._currentTarget = currentTarget;
    }
}
/**
 * Fires the listener for the specified context. Returns `true` if event was stopped.
 *
 * @param eventInfo The `EventInfo` object.
 * @param eventArgs Additional arguments to be passed to the callbacks.
 * @returns True if event stop was called.
 */
function fireListenerFor(eventContexts, context, eventInfo, ...eventArgs) {
    const emitter = typeof context == 'string' ? eventContexts.get(context) : getCustomContext(eventContexts, context);
    if (!emitter) {
        return false;
    }
    emitter.fire(eventInfo, ...eventArgs);
    return eventInfo.stop.called;
}
/**
 * Returns an emitter for a specified view node.
 */
function getCustomContext(eventContexts, node) {
    for (const [context, emitter] of eventContexts) {
        if (typeof context == 'function' && context(node)) {
            return emitter;
        }
    }
    return null;
}
/**
 * Returns bubbling contexts map for the source (emitter).
 */
function getBubblingContexts(source) {
    if (!source[contextsSymbol]) {
        source[contextsSymbol] = new Map();
    }
    return source[contextsSymbol];
}
/**
 * Returns the deeper parent element for the range.
 */
function getDeeperRangeParent(range) {
    if (!range) {
        return null;
    }
    const startParent = range.start.parent;
    const endParent = range.end.parent;
    const startPath = startParent.getPath();
    const endPath = endParent.getPath();
    return startPath.length > endPath.length ? startParent : endParent;
}
