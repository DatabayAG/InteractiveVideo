/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/detachoperation
 */
import Operation from './operation.js';
import Range from '../range.js';
import { _remove } from './utils.js';
import { CKEditorError } from '@ckeditor/ckeditor5-utils';
// @if CK_DEBUG_ENGINE // const ModelRange = require( '../range' ).default;
/**
 * Operation to permanently remove node from detached root.
 * Note this operation is only a local operation and won't be send to the other clients.
 */
export default class DetachOperation extends Operation {
    /**
     * Creates an insert operation.
     *
     * @param sourcePosition Position before the first {@link module:engine/model/item~Item model item} to move.
     * @param howMany Offset size of moved range. Moved range will start from `sourcePosition` and end at
     * `sourcePosition` with offset shifted by `howMany`.
     */
    constructor(sourcePosition, howMany) {
        super(null);
        this.sourcePosition = sourcePosition.clone();
        this.howMany = howMany;
    }
    /**
     * @inheritDoc
     */
    get type() {
        return 'detach';
    }
    /**
     * @inheritDoc
     */
    get affectedSelectable() {
        return null;
    }
    /**
     * @inheritDoc
     */
    toJSON() {
        const json = super.toJSON();
        json.sourcePosition = this.sourcePosition.toJSON();
        return json;
    }
    /**
     * @inheritDoc
     * @internal
     */
    _validate() {
        if (this.sourcePosition.root.document) {
            /**
             * Cannot detach document node.
             *
             * @error detach-operation-on-document-node
             */
            throw new CKEditorError('detach-operation-on-document-node', this);
        }
    }
    /**
     * @inheritDoc
     * @internal
     */
    _execute() {
        _remove(Range._createFromPositionAndShift(this.sourcePosition, this.howMany));
    }
    /**
     * @inheritDoc
     */
    static get className() {
        return 'DetachOperation';
    }
}
