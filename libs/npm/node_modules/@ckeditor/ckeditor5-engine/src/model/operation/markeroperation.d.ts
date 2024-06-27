/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/operation/markeroperation
 */
import Operation from './operation.js';
import Range from '../range.js';
import type Document from '../document.js';
import type MarkerCollection from '../markercollection.js';
import type { Selectable } from '../selection.js';
export default class MarkerOperation extends Operation {
    /**
     * Marker name.
     *
     * @readonly
     */
    name: string;
    /**
     * Marker range before the change.
     *
     * @readonly
     */
    oldRange: Range | null;
    /**
     * Marker range after the change.
     *
     * @readonly
     */
    newRange: Range | null;
    /**
     * Specifies whether the marker operation affects the data produced by the data pipeline
     * (is persisted in the editor's data).
     *
     * @readonly
     */
    affectsData: boolean;
    /**
     * Marker collection on which change should be executed.
     */
    private readonly _markers;
    /**
     * @param name Marker name.
     * @param oldRange Marker range before the change.
     * @param newRange Marker range after the change.
     * @param markers Marker collection on which change should be executed.
     * @param affectsData Specifies whether the marker operation affects the data produced by the data pipeline
     * (is persisted in the editor's data).
     * @param baseVersion Document {@link module:engine/model/document~Document#version} on which operation
     * can be applied or `null` if the operation operates on detached (non-document) tree.
     */
    constructor(name: string, oldRange: Range | null, newRange: Range | null, markers: MarkerCollection, affectsData: boolean, baseVersion: number | null);
    /**
     * @inheritDoc
     */
    get type(): 'marker';
    /**
     * @inheritDoc
     */
    get affectedSelectable(): Selectable;
    /**
     * Creates and returns an operation that has the same parameters as this operation.
     */
    clone(): MarkerOperation;
    /**
     * See {@link module:engine/model/operation/operation~Operation#getReversed `Operation#getReversed()`}.
     */
    getReversed(): Operation;
    /**
     * @inheritDoc
     * @internal
     */
    _execute(): void;
    /**
     * @inheritDoc
     * @internal
     */
    toJSON(): unknown;
    /**
     * @inheritDoc
     */
    static get className(): string;
    /**
     * Creates `MarkerOperation` object from deserialized object, i.e. from parsed JSON string.
     *
     * @param json Deserialized JSON object.
     * @param document Document on which this operation will be applied.
     */
    static fromJSON(json: any, document: Document): MarkerOperation;
}
