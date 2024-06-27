/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/liverange
 */
import Range from './range.js';
import { EmitterMixin } from '@ckeditor/ckeditor5-utils';
/**
 * `LiveRange` is a type of {@link module:engine/model/range~Range Range}
 * that updates itself as {@link module:engine/model/document~Document document}
 * is changed through operations. It may be used as a bookmark.
 *
 * **Note:** Be very careful when dealing with `LiveRange`. Each `LiveRange` instance bind events that might
 * have to be unbound. Use {@link module:engine/model/liverange~LiveRange#detach detach} whenever you don't need `LiveRange` anymore.
 */
export default class LiveRange extends /* #__PURE__ */ EmitterMixin(Range) {
    /**
     * Creates a live range.
     *
     * @see module:engine/model/range~Range
     */
    constructor(start, end) {
        super(start, end);
        bindWithDocument.call(this);
    }
    /**
     * Unbinds all events previously bound by `LiveRange`. Use it whenever you don't need `LiveRange` instance
     * anymore (i.e. when leaving scope in which it was declared or before re-assigning variable that was
     * referring to it).
     */
    detach() {
        this.stopListening();
    }
    /**
     * Creates a {@link module:engine/model/range~Range range instance} that is equal to this live range.
     */
    toRange() {
        return new Range(this.start, this.end);
    }
    /**
     * Creates a `LiveRange` instance that is equal to the given range.
     */
    static fromRange(range) {
        return new LiveRange(range.start, range.end);
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
LiveRange.prototype.is = function (type) {
    return type === 'liveRange' || type === 'model:liveRange' ||
        // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
        type == 'range' || type === 'model:range';
};
/**
 * Binds this `LiveRange` to the {@link module:engine/model/document~Document document}
 * that owns this range's {@link module:engine/model/range~Range#root root}.
 */
function bindWithDocument() {
    this.listenTo(this.root.document.model, 'applyOperation', (event, args) => {
        const operation = args[0];
        if (!operation.isDocumentOperation) {
            return;
        }
        transform.call(this, operation);
    }, { priority: 'low' });
}
/**
 * Updates this range accordingly to the updates applied to the model. Bases on change events.
 */
function transform(operation) {
    // Transform the range by the operation. Join the result ranges if needed.
    const ranges = this.getTransformedByOperation(operation);
    const result = Range._createFromRanges(ranges);
    const boundariesChanged = !result.isEqual(this);
    const contentChanged = doesOperationChangeRangeContent(this, operation);
    let deletionPosition = null;
    if (boundariesChanged) {
        // If range boundaries have changed, fire `change:range` event.
        //
        if (result.root.rootName == '$graveyard') {
            // If the range was moved to the graveyard root, set `deletionPosition`.
            if (operation.type == 'remove') {
                deletionPosition = operation.sourcePosition;
            }
            else {
                // Merge operation.
                deletionPosition = operation.deletionPosition;
            }
        }
        const oldRange = this.toRange();
        this.start = result.start;
        this.end = result.end;
        this.fire('change:range', oldRange, { deletionPosition });
    }
    else if (contentChanged) {
        // If range boundaries have not changed, but there was change inside the range, fire `change:content` event.
        this.fire('change:content', this.toRange(), { deletionPosition });
    }
}
/**
 * Checks whether given operation changes something inside the range (even if it does not change boundaries).
 */
function doesOperationChangeRangeContent(range, operation) {
    switch (operation.type) {
        case 'insert':
            return range.containsPosition(operation.position);
        case 'move':
        case 'remove':
        case 'reinsert':
        case 'merge':
            return range.containsPosition(operation.sourcePosition) ||
                range.start.isEqual(operation.sourcePosition) ||
                range.containsPosition(operation.targetPosition);
        case 'split':
            return range.containsPosition(operation.splitPosition) || range.containsPosition(operation.insertionPosition);
    }
    return false;
}
