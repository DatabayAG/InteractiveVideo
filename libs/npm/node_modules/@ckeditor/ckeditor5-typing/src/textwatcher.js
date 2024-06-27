/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module typing/textwatcher
 */
import { ObservableMixin } from '@ckeditor/ckeditor5-utils';
import getLastTextLine from './utils/getlasttextline.js';
/**
 * The text watcher feature.
 *
 * Fires the {@link module:typing/textwatcher~TextWatcher#event:matched:data `matched:data`},
 * {@link module:typing/textwatcher~TextWatcher#event:matched:selection `matched:selection`} and
 * {@link module:typing/textwatcher~TextWatcher#event:unmatched `unmatched`} events on typing or selection changes.
 */
export default class TextWatcher extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates a text watcher instance.
     *
     * @param testCallback See {@link module:typing/textwatcher~TextWatcher#testCallback}.
     */
    constructor(model, testCallback) {
        super();
        this.model = model;
        this.testCallback = testCallback;
        this._hasMatch = false;
        this.set('isEnabled', true);
        // Toggle text watching on isEnabled state change.
        this.on('change:isEnabled', () => {
            if (this.isEnabled) {
                this._startListening();
            }
            else {
                this.stopListening(model.document.selection);
                this.stopListening(model.document);
            }
        });
        this._startListening();
    }
    /**
     * Flag indicating whether there is a match currently.
     */
    get hasMatch() {
        return this._hasMatch;
    }
    /**
     * Starts listening to the editor for typing and selection events.
     */
    _startListening() {
        const model = this.model;
        const document = model.document;
        this.listenTo(document.selection, 'change:range', (evt, { directChange }) => {
            // Indirect changes (i.e. when the user types or external changes are applied) are handled in the document's change event.
            if (!directChange) {
                return;
            }
            // Act only on collapsed selection.
            if (!document.selection.isCollapsed) {
                if (this.hasMatch) {
                    this.fire('unmatched');
                    this._hasMatch = false;
                }
                return;
            }
            this._evaluateTextBeforeSelection('selection');
        });
        this.listenTo(document, 'change:data', (evt, batch) => {
            if (batch.isUndo || !batch.isLocal) {
                return;
            }
            this._evaluateTextBeforeSelection('data', { batch });
        });
    }
    /**
     * Checks the editor content for matched text.
     *
     * @fires matched:data
     * @fires matched:selection
     * @fires unmatched
     *
     * @param suffix A suffix used for generating the event name.
     * @param data Data object for event.
     */
    _evaluateTextBeforeSelection(suffix, data = {}) {
        const model = this.model;
        const document = model.document;
        const selection = document.selection;
        const rangeBeforeSelection = model.createRange(model.createPositionAt(selection.focus.parent, 0), selection.focus);
        const { text, range } = getLastTextLine(rangeBeforeSelection, model);
        const testResult = this.testCallback(text);
        if (!testResult && this.hasMatch) {
            this.fire('unmatched');
        }
        this._hasMatch = !!testResult;
        if (testResult) {
            const eventData = Object.assign(data, { text, range });
            // If the test callback returns an object with additional data, assign the data as well.
            if (typeof testResult == 'object') {
                Object.assign(eventData, testResult);
            }
            this.fire(`matched:${suffix}`, eventData);
        }
    }
}
