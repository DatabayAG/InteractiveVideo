/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/styles/background
 */
import type { StylesProcessor } from '../stylesmap.js';
/**
 * Adds a background CSS styles processing rules.
 *
 * ```ts
 * editor.data.addStyleProcessorRules( addBackgroundRules );
 * ```
 *
 * The normalized value is stored as:
 *
 * ```ts
 * const styles = {
 * 	background: {
 * 		color,
 * 		repeat,
 * 		position,
 * 		attachment,
 * 		image
 * 	}
 * };
 * ````
 *
 * **Note**: Currently only `'background-color'` longhand value is parsed besides `'background'` shorthand. The reducer also supports only
 * `'background-color'` value.
 */
export declare function addBackgroundRules(stylesProcessor: StylesProcessor): void;
