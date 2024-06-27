/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module find-and-replace/findandreplacestate
 */
import type { Model, Item } from 'ckeditor5/src/engine.js';
import { Collection } from 'ckeditor5/src/utils.js';
import type { ResultType } from './findandreplace.js';
declare const FindAndReplaceState_base: {
    new (): import("ckeditor5/src/utils.js").Observable;
    prototype: import("ckeditor5/src/utils.js").Observable;
};
/**
 * The object storing find and replace plugin state for a given editor instance.
 */
export default class FindAndReplaceState extends /* #__PURE__ */ FindAndReplaceState_base {
    /**
     * A collection of find matches.
     *
     * @observable
     */
    results: Collection<ResultType>;
    /**
     * Currently highlighted search result in {@link #results matched results}.
     *
     * @readonly
     * @observable
     */
    highlightedResult: ResultType | null;
    /**
     * Currently highlighted search result offset in {@link #results matched results}.
     *
     * @readonly
     * @observable
     */
    highlightedOffset: number;
    /**
     * Searched text value.
     *
     * @readonly
     * @observable
     */
    searchText: string;
    /**
     *  The most recent search callback used by the feature to find matches.
     *  It is used to re-run the search when user modifies the editor content.
     *
     * @readonly
     * @observable
     */
    lastSearchCallback: FindCallback | null;
    /**
     * Replace text value.
     *
     * @readonly
     * @observable
     */
    replaceText: string;
    /**
     * Indicates whether the matchCase checkbox has been checked.
     *
     * @readonly
     * @observable
     */
    matchCase: boolean;
    /**
     * Indicates whether the matchWholeWords checkbox has been checked.
     *
     * @readonly
     * @observable
     */
    matchWholeWords: boolean;
    /**
     * Creates an instance of the state.
     */
    constructor(model: Model);
    /**
     * Cleans the state up and removes markers from the model.
     */
    clear(model: Model): void;
    /**
     * Refreshes the highlight result offset based on it's index within the result list.
     */
    refreshHighlightOffset(): void;
}
/**
 * The callback function used to find matches in the document.
 */
export type FindCallback = (({ item, text }: {
    item: Item;
    text: string;
}) => Array<ResultType>);
export {};
