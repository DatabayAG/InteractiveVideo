/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/converters/table-cell-paragraph-post-fixer
 */
import type { Model } from 'ckeditor5/src/engine.js';
/**
 * Injects a table cell post-fixer into the model which inserts a `paragraph` element into empty table cells.
 *
 * A table cell must contain at least one block element as a child. An empty table cell will have an empty `paragraph` as a child.
 *
 * ```xml
 * <table>
 *   <tableRow>
 *      <tableCell></tableCell>
 *   </tableRow>
 * </table>
 * ```
 *
 * Will be fixed to:
 *
 * ```xml
 * <table>
 *   <tableRow>
 *      <tableCell><paragraph></paragraph></tableCell>
 *   </tableRow>
 * </table>
 * ```
 */
export default function injectTableCellParagraphPostFixer(model: Model): void;
