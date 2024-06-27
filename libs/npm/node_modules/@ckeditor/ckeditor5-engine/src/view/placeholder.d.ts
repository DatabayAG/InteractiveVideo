/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/placeholder
 */
import '../../theme/placeholder.css';
import type DowncastWriter from './downcastwriter.js';
import type EditableElement from './editableelement.js';
import type Element from './element.js';
import type View from './view.js';
/**
 * A helper that enables a placeholder on the provided view element (also updates its visibility).
 * The placeholder is a CSS pseudo–element (with a text content) attached to the element.
 *
 * To change the placeholder text, change value of the `placeholder` property in the provided `element`.
 *
 * To disable the placeholder, use {@link module:engine/view/placeholder~disablePlaceholder `disablePlaceholder()`} helper.
 *
 * @param options Configuration options of the placeholder.
 * @param options.view Editing view instance.
 * @param options.element Element that will gain a placeholder. See `options.isDirectHost` to learn more.
 * @param options.isDirectHost If set `false`, the placeholder will not be enabled directly
 * in the passed `element` but in one of its children (selected automatically, i.e. a first empty child element).
 * Useful when attaching placeholders to elements that can host other elements (not just text), for instance,
 * editable root elements.
 * @param options.text Placeholder text. It's **deprecated** and will be removed soon. Use
 * {@link module:engine/view/placeholder~PlaceholderableElement#placeholder `options.element.placeholder`} instead.
 * @param options.keepOnFocus If set `true`, the placeholder stay visible when the host element is focused.
 */
export declare function enablePlaceholder({ view, element, text, isDirectHost, keepOnFocus }: {
    view: View;
    element: PlaceholderableElement | EditableElement;
    isDirectHost?: boolean;
    text?: string;
    keepOnFocus?: boolean;
}): void;
/**
 * Disables the placeholder functionality from a given element.
 *
 * See {@link module:engine/view/placeholder~enablePlaceholder `enablePlaceholder()`} to learn more.
 */
export declare function disablePlaceholder(view: View, element: Element): void;
/**
 * Shows a placeholder in the provided element by changing related attributes and CSS classes.
 *
 * **Note**: This helper will not update the placeholder visibility nor manage the
 * it in any way in the future. What it does is a one–time state change of an element. Use
 * {@link module:engine/view/placeholder~enablePlaceholder `enablePlaceholder()`} and
 * {@link module:engine/view/placeholder~disablePlaceholder `disablePlaceholder()`} for full
 * placeholder functionality.
 *
 * **Note**: This helper will blindly show the placeholder directly in the root editable element if
 * one is passed, which could result in a visual clash if the editable element has some children
 * (for instance, an empty paragraph). Use {@link module:engine/view/placeholder~enablePlaceholder `enablePlaceholder()`}
 * in that case or make sure the correct element is passed to the helper.
 *
 * @returns `true`, if any changes were made to the `element`.
 */
export declare function showPlaceholder(writer: DowncastWriter, element: Element): boolean;
/**
 * Hides a placeholder in the element by changing related attributes and CSS classes.
 *
 * **Note**: This helper will not update the placeholder visibility nor manage the
 * it in any way in the future. What it does is a one–time state change of an element. Use
 * {@link module:engine/view/placeholder~enablePlaceholder `enablePlaceholder()`} and
 * {@link module:engine/view/placeholder~disablePlaceholder `disablePlaceholder()`} for full
 * placeholder functionality.
 *
 * @returns `true`, if any changes were made to the `element`.
 */
export declare function hidePlaceholder(writer: DowncastWriter, element: Element): boolean;
/**
 * Checks if a placeholder should be displayed in the element.
 *
 * **Note**: This helper will blindly check the possibility of showing a placeholder directly in the
 * root editable element if one is passed, which may not be the expected result. If an element can
 * host other elements (not just text), most likely one of its children should be checked instead
 * because it will be the final host for the placeholder. Use
 * {@link module:engine/view/placeholder~enablePlaceholder `enablePlaceholder()`} in that case or make
 * sure the correct element is passed to the helper.
 *
 * @param element Element that holds the placeholder.
 * @param keepOnFocus Focusing the element will keep the placeholder visible.
 */
export declare function needsPlaceholder(element: Element, keepOnFocus: boolean): boolean;
/**
 * Element that could have a placeholder.
 */
export interface PlaceholderableElement extends Element {
    /**
     * The text of element's placeholder.
     */
    placeholder?: string;
}
