/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module find-and-replace/findandreplace
 */
import { Plugin } from 'ckeditor5/src/core.js';
import FindAndReplaceUI from './findandreplaceui.js';
import FindAndReplaceEditing from './findandreplaceediting.js';
import type { Marker } from 'ckeditor5/src/engine.js';
export type ResultType = {
    id?: string;
    label?: string;
    start?: number;
    end?: number;
    marker?: Marker;
};
/**
 * The find and replace plugin.
 *
 * For a detailed overview, check the {@glink features/find-and-replace Find and replace feature documentation}.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * The {@link module:find-and-replace/findandreplaceediting~FindAndReplaceEditing find and replace editing feature},
 * * The {@link module:find-and-replace/findandreplaceui~FindAndReplaceUI find and replace UI feature}
 */
export default class FindAndReplace extends Plugin {
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof FindAndReplaceEditing, typeof FindAndReplaceUI];
    /**
     * @inheritDoc
     */
    static get pluginName(): "FindAndReplace";
    /**
     * @inheritDoc
     */
    init(): void;
}
