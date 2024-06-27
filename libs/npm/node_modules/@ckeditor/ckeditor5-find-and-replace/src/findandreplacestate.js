/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { ObservableMixin, Collection } from 'ckeditor5/src/utils.js';
/**
 * The object storing find and replace plugin state for a given editor instance.
 */
export default class FindAndReplaceState extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates an instance of the state.
     */
    constructor(model) {
        super();
        this.set('results', new Collection());
        this.set('highlightedResult', null);
        this.set('highlightedOffset', 0);
        this.set('searchText', '');
        this.set('replaceText', '');
        this.set('lastSearchCallback', null);
        this.set('matchCase', false);
        this.set('matchWholeWords', false);
        this.results.on('change', (eventInfo, { removed, index }) => {
            if (Array.from(removed).length) {
                let highlightedResultRemoved = false;
                model.change(writer => {
                    for (const removedResult of removed) {
                        if (this.highlightedResult === removedResult) {
                            highlightedResultRemoved = true;
                        }
                        if (model.markers.has(removedResult.marker.name)) {
                            writer.removeMarker(removedResult.marker);
                        }
                    }
                });
                if (highlightedResultRemoved) {
                    const nextHighlightedIndex = index >= this.results.length ? 0 : index;
                    this.highlightedResult = this.results.get(nextHighlightedIndex);
                }
            }
        });
        this.on('change:highlightedResult', () => {
            this.refreshHighlightOffset();
        });
    }
    /**
     * Cleans the state up and removes markers from the model.
     */
    clear(model) {
        this.searchText = '';
        model.change(writer => {
            if (this.highlightedResult) {
                const oldMatchId = this.highlightedResult.marker.name.split(':')[1];
                const oldMarker = model.markers.get(`findResultHighlighted:${oldMatchId}`);
                if (oldMarker) {
                    writer.removeMarker(oldMarker);
                }
            }
            [...this.results].forEach(({ marker }) => {
                writer.removeMarker(marker);
            });
        });
        this.results.clear();
    }
    /**
     * Refreshes the highlight result offset based on it's index within the result list.
     */
    refreshHighlightOffset() {
        const { highlightedResult, results } = this;
        const sortMapping = { before: -1, same: 0, after: 1, different: 1 };
        if (highlightedResult) {
            this.highlightedOffset = Array.from(results)
                .sort((a, b) => sortMapping[a.marker.getStart().compareWith(b.marker.getStart())])
                .indexOf(highlightedResult) + 1;
        }
        else {
            this.highlightedOffset = 0;
        }
    }
}
