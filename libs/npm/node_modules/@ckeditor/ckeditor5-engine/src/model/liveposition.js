/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/liveposition
 */
import Position from './position.js';
import { CKEditorError, EmitterMixin } from '@ckeditor/ckeditor5-utils';
/**
 * `LivePosition` is a type of {@link module:engine/model/position~Position Position}
 * that updates itself as {@link module:engine/model/document~Document document}
 * is changed through operations. It may be used as a bookmark.
 *
 * **Note:** Contrary to {@link module:engine/model/position~Position}, `LivePosition` works only in roots that are
 * {@link module:engine/model/rootelement~RootElement}.
 * If {@link module:engine/model/documentfragment~DocumentFragment} is passed, error will be thrown.
 *
 * **Note:** Be very careful when dealing with `LivePosition`. Each `LivePosition` instance bind events that might
 * have to be unbound.
 * Use {@link module:engine/model/liveposition~LivePosition#detach} whenever you don't need `LivePosition` anymore.
 */
export default class LivePosition extends /* #__PURE__ */ EmitterMixin(Position) {
    /**
     * Creates a live position.
     *
     * @see module:engine/model/position~Position
     */
    constructor(root, path, stickiness = 'toNone') {
        super(root, path, stickiness);
        if (!this.root.is('rootElement')) {
            /**
             * LivePosition's root has to be an instance of RootElement.
             *
             * @error model-liveposition-root-not-rootelement
             */
            throw new CKEditorError('model-liveposition-root-not-rootelement', root);
        }
        bindWithDocument.call(this);
    }
    /**
     * Unbinds all events previously bound by `LivePosition`. Use it whenever you don't need `LivePosition` instance
     * anymore (i.e. when leaving scope in which it was declared or before re-assigning variable that was
     * referring to it).
     */
    detach() {
        this.stopListening();
    }
    /**
     * Creates a {@link module:engine/model/position~Position position instance}, which is equal to this live position.
     */
    toPosition() {
        return new Position(this.root, this.path.slice(), this.stickiness);
    }
    /**
     * Creates a `LivePosition` instance that is equal to position.
     */
    static fromPosition(position, stickiness) {
        return new this(position.root, position.path.slice(), stickiness ? stickiness : position.stickiness);
    }
}
// The magic of type inference using `is` method is centralized in `TypeCheckable` class.
// Proper overload would interfere with that.
LivePosition.prototype.is = function (type) {
    return type === 'livePosition' || type === 'model:livePosition' ||
        // From super.is(). This is highly utilised method and cannot call super. See ckeditor/ckeditor5#6529.
        type == 'position' || type === 'model:position';
};
/**
 * Binds this `LivePosition` to the {@link module:engine/model/document~Document document} that owns
 * this position's {@link module:engine/model/position~Position#root root}.
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
 * Updates this position accordingly to the updates applied to the model. Bases on change events.
 */
function transform(operation) {
    const result = this.getTransformedByOperation(operation);
    if (!this.isEqual(result)) {
        const oldPosition = this.toPosition();
        this.path = result.path;
        this.root = result.root;
        this.fire('change', oldPosition);
    }
}
