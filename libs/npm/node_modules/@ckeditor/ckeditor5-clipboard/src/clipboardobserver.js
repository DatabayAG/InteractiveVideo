/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module clipboard/clipboardobserver
 */
import { EventInfo } from '@ckeditor/ckeditor5-utils';
import { DataTransfer, DomEventObserver } from '@ckeditor/ckeditor5-engine';
/**
 * Clipboard events observer.
 *
 * Fires the following events:
 *
 * * {@link module:engine/view/document~Document#event:clipboardInput},
 * * {@link module:engine/view/document~Document#event:paste},
 * * {@link module:engine/view/document~Document#event:copy},
 * * {@link module:engine/view/document~Document#event:cut},
 * * {@link module:engine/view/document~Document#event:drop},
 * * {@link module:engine/view/document~Document#event:dragover},
 * * {@link module:engine/view/document~Document#event:dragging},
 * * {@link module:engine/view/document~Document#event:dragstart},
 * * {@link module:engine/view/document~Document#event:dragend},
 * * {@link module:engine/view/document~Document#event:dragenter},
 * * {@link module:engine/view/document~Document#event:dragleave}.
 *
 * **Note**: This observer is not available by default (ckeditor5-engine does not add it on its own).
 * To make it available, it needs to be added to {@link module:engine/view/document~Document} by using
 * the {@link module:engine/view/view~View#addObserver `View#addObserver()`} method. Alternatively, you can load the
 * {@link module:clipboard/clipboard~Clipboard} plugin which adds this observer automatically (because it uses it).
 */
export default class ClipboardObserver extends DomEventObserver {
    constructor(view) {
        super(view);
        this.domEventType = [
            'paste', 'copy', 'cut', 'drop', 'dragover', 'dragstart', 'dragend', 'dragenter', 'dragleave'
        ];
        const viewDocument = this.document;
        this.listenTo(viewDocument, 'paste', handleInput('clipboardInput'), { priority: 'low' });
        this.listenTo(viewDocument, 'drop', handleInput('clipboardInput'), { priority: 'low' });
        this.listenTo(viewDocument, 'dragover', handleInput('dragging'), { priority: 'low' });
        function handleInput(type) {
            return (evt, data) => {
                data.preventDefault();
                const targetRanges = data.dropRange ? [data.dropRange] : null;
                const eventInfo = new EventInfo(viewDocument, type);
                viewDocument.fire(eventInfo, {
                    dataTransfer: data.dataTransfer,
                    method: evt.name,
                    targetRanges,
                    target: data.target,
                    domEvent: data.domEvent
                });
                // If CKEditor handled the input, do not bubble the original event any further.
                // This helps external integrations recognize that fact and act accordingly.
                // https://github.com/ckeditor/ckeditor5-upload/issues/92
                if (eventInfo.stop.called) {
                    data.stopPropagation();
                }
            };
        }
    }
    onDomEvent(domEvent) {
        const nativeDataTransfer = 'clipboardData' in domEvent ? domEvent.clipboardData : domEvent.dataTransfer;
        const cacheFiles = domEvent.type == 'drop' || domEvent.type == 'paste';
        const evtData = {
            dataTransfer: new DataTransfer(nativeDataTransfer, { cacheFiles })
        };
        if (domEvent.type == 'drop' || domEvent.type == 'dragover') {
            evtData.dropRange = getDropViewRange(this.view, domEvent);
        }
        this.fire(domEvent.type, domEvent, evtData);
    }
}
function getDropViewRange(view, domEvent) {
    const domDoc = domEvent.target.ownerDocument;
    const x = domEvent.clientX;
    const y = domEvent.clientY;
    let domRange;
    // Webkit & Blink.
    if (domDoc.caretRangeFromPoint && domDoc.caretRangeFromPoint(x, y)) {
        domRange = domDoc.caretRangeFromPoint(x, y);
    }
    // FF.
    else if (domEvent.rangeParent) {
        domRange = domDoc.createRange();
        domRange.setStart(domEvent.rangeParent, domEvent.rangeOffset);
        domRange.collapse(true);
    }
    if (domRange) {
        return view.domConverter.domRangeToView(domRange);
    }
    return null;
}
