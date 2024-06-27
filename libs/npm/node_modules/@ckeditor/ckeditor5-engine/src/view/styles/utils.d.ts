/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/styles/utils
 */
import type { BoxSides, PropertyDescriptor, StyleValue } from '../stylesmap.js';
/**
 * Checks if string contains [color](https://developer.mozilla.org/en-US/docs/Web/CSS/color) CSS value.
 *
 * ```ts
 * isColor( '#f00' );						// true
 * isColor( '#AA00BB33' );					// true
 * isColor( 'rgb(0, 0, 250)' );				// true
 * isColor( 'hsla(240, 100%, 50%, .7)' );	// true
 * isColor( 'deepskyblue' );				// true
 * ```
 *
 * **Note**: It does not support CSS Level 4 whitespace syntax, system colors and radius values for HSL colors.
 */
export declare function isColor(string: string): boolean;
/**
 * Checks if string contains [line style](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style) CSS value.
 */
export declare function isLineStyle(string: string): boolean;
/**
 * Checks if string contains [length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) CSS value.
 */
export declare function isLength(string: string): boolean;
/**
 * Checks if string contains [percentage](https://developer.mozilla.org/en-US/docs/Web/CSS/percentage) CSS value.
 */
export declare function isPercentage(string: string): boolean;
/**
 * Checks if string contains [background repeat](https://developer.mozilla.org/en-US/docs/Web/CSS/background-repeat) CSS value.
 */
export declare function isRepeat(string: string): boolean;
/**
 * Checks if string contains [background position](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position) CSS value.
 */
export declare function isPosition(string: string): boolean;
/**
 * Checks if string contains [background attachment](https://developer.mozilla.org/en-US/docs/Web/CSS/background-attachment) CSS value.
 */
export declare function isAttachment(string: string): boolean;
/**
 * Checks if string contains [URL](https://developer.mozilla.org/en-US/docs/Web/CSS/url) CSS value.
 */
export declare function isURL(string: string): boolean;
/**
 * Parses box sides as individual values.
 */
export declare function getBoxSidesValues(value?: string): BoxSides;
/**
 * Default reducer for CSS properties that concerns edges of a box
 * [shorthand](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties) notations:
 *
 * ```ts
 * stylesProcessor.setReducer( 'padding', getBoxSidesValueReducer( 'padding' ) );
 * ```
 */
export declare function getBoxSidesValueReducer(styleShorthand: string): (value: StyleValue) => Array<PropertyDescriptor>;
/**
 * Returns a [shorthand](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties) notation
 * of a CSS property value.
 *
 * ```ts
 * getBoxSidesShorthandValue( { top: '1px', right: '1px', bottom: '2px', left: '1px' } );
 * // will return '1px 1px 2px'
 * ```
 */
export declare function getBoxSidesShorthandValue({ top, right, bottom, left }: BoxSides): string;
/**
 * Creates a normalizer for a [shorthand](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties) 1-to-4 value.
 *
 * ```ts
 * stylesProcessor.setNormalizer( 'margin', getPositionShorthandNormalizer( 'margin' ) );
 * ```
 */
export declare function getPositionShorthandNormalizer(shorthand: string): (value: string) => {
    path: string;
    value: BoxSides;
};
/**
 * Parses parts of a 1-to-4 value notation - handles some CSS values with spaces (like RGB()).
 *
 * ```ts
 * getShorthandValues( 'red blue RGB(0, 0, 0)');
 * // will return [ 'red', 'blue', 'RGB(0, 0, 0)' ]
 * ```
 */
export declare function getShorthandValues(string: string): Array<string>;
