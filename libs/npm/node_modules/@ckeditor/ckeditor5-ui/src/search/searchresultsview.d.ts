/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/search/searchresultsview
 */
import View from '../view.js';
import type ViewCollection from '../viewcollection.js';
import { FocusTracker, type Locale } from '@ckeditor/ckeditor5-utils';
import { default as FocusCycler, type FocusableView } from '../focuscycler.js';
/**
 * A sub-component of {@link module:ui/search/text/searchtextview~SearchTextView}. It hosts the filtered and the information views.
 */
export default class SearchResultsView extends View implements FocusableView {
    /**
     * Tracks information about the DOM focus in the view.
     *
     * @readonly
     */
    focusTracker: FocusTracker;
    /**
     * The collection of the child views inside of the list item {@link #element}.
     *
     * @readonly
     */
    children: ViewCollection<FocusableView>;
    /**
     * Provides the focus management (keyboard navigation) in the view.
     *
     * @readonly
     */
    protected _focusCycler: FocusCycler;
    /**
     * @inheritDoc
     */
    constructor(locale: Locale);
    /**
     * @inheritDoc
     */
    render(): void;
    /**
     * Focuses the view.
     */
    focus(): void;
    /**
     * Focuses the first child view.
     */
    focusFirst(): void;
    /**
     * Focuses the last child view.
     */
    focusLast(): void;
}
