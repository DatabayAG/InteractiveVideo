/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/detachoperation
 */
import Operation from './operation.js';
import type Position from '../position.js';
import type { Selectable } from '../selection.js';
/**
 * Operation to permanently remove node from detached root.
 * Note this operation is only a local operation and won't be send to the other clients.
 */
export default class DetachOperation extends Operation {
    /**
     * Position before the first {@link module:engine/model/item~Item model item} to detach.
     */
    sourcePosition: Position;
    /**
     * Offset size of moved range.
     */
    howMany: number;
    clone: never;
    getReversed: never;
    /**
     * Creates an insert operation.
     *
     * @param sourcePosition Position before the first {@link module:engine/model/item~Item model item} to move.
     * @param howMany Offset size of moved range. Moved range will start from `sourcePosition` and end at
     * `sourcePosition` with offset shifted by `howMany`.
     */
    constructor(sourcePosition: Position, howMany: number);
    /**
     * @inheritDoc
     */
    get type(): 'detach';
    /**
     * @inheritDoc
     */
    get affectedSelectable(): Selectable;
    /**
     * @inheritDoc
     */
    toJSON(): unknown;
    /**
     * @inheritDoc
     * @internal
     */
    _validate(): void;
    /**
     * @inheritDoc
     * @internal
     */
    _execute(): void;
    /**
     * @inheritDoc
     */
    static get className(): string;
}
