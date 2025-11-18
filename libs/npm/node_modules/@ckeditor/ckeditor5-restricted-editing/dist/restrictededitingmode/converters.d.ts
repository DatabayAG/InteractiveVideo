/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module restricted-editing/restrictededitingmode/converters
 */
import type { Editor } from 'ckeditor5/src/core.js';
import { type MatcherPattern, type ModelPostFixer, type UpcastDispatcher } from 'ckeditor5/src/engine.js';
/**
 * Adds a visual highlight style to a restricted editing exception that the selection is anchored to.
 *
 * The highlight is turned on by adding the `.restricted-editing-exception_selected` class to the
 * exception in the view:
 *
 * * The class is removed before the conversion starts, as callbacks added with the `'highest'` priority
 * to {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher} events.
 * * The class is added in the view post-fixer, after other changes in the model tree are converted to the view.
 *
 * This way, adding and removing the highlight does not interfere with conversion.
 */
export declare function setupExceptionHighlighting(editor: Editor): void;
/**
 * A post-fixer that prevents removing a collapsed marker from the document.
 */
export declare function resurrectCollapsedMarkerPostFixer(editor: Editor): ModelPostFixer;
/**
 * A post-fixer that extends a marker when the user types on its boundaries.
 */
export declare function extendMarkerOnTypingPostFixer(editor: Editor): ModelPostFixer;
/**
 * A view highlight-to-marker conversion helper.
 *
 * @param config Conversion configuration.
 */
export declare function upcastHighlightToMarker(config: {
    view: MatcherPattern;
    model: () => string;
}): (dispatcher: UpcastDispatcher) => void;
