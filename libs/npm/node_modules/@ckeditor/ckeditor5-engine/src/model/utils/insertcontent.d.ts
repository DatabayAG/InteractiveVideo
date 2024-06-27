/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/utils/insertcontent
 */
import DocumentSelection from '../documentselection.js';
import Range from '../range.js';
import type DocumentFragment from '../documentfragment.js';
import type Item from '../item.js';
import type Model from '../model.js';
import type Selection from '../selection.js';
/**
 * Inserts content into the editor (specified selection) as one would expect the paste functionality to work.
 *
 * It takes care of removing the selected content, splitting elements (if needed), inserting elements and merging elements appropriately.
 *
 * Some examples:
 *
 * ```html
 * <p>x^</p> + <p>y</p> => <p>x</p><p>y</p> => <p>xy[]</p>
 * <p>x^y</p> + <p>z</p> => <p>x</p>^<p>y</p> + <p>z</p> => <p>x</p><p>z</p><p>y</p> => <p>xz[]y</p>
 * <p>x^y</p> + <img /> => <p>x</p>^<p>y</p> + <img /> => <p>x</p><img /><p>y</p>
 * <p>x</p><p>^</p><p>z</p> + <p>y</p> => <p>x</p><p>y[]</p><p>z</p> (no merging)
 * <p>x</p>[<img />]<p>z</p> + <p>y</p> => <p>x</p>^<p>z</p> + <p>y</p> => <p>x</p><p>y[]</p><p>z</p>
 * ```
 *
 * If an instance of {@link module:engine/model/selection~Selection} is passed as `selectable` it will be modified
 * to the insertion selection (equal to a range to be selected after insertion).
 *
 * If `selectable` is not passed, the content will be inserted using the current selection of the model document.
 *
 * **Note:** Use {@link module:engine/model/model~Model#insertContent} instead of this function.
 * This function is only exposed to be reusable in algorithms which change the {@link module:engine/model/model~Model#insertContent}
 * method's behavior.
 *
 * @param model The model in context of which the insertion should be performed.
 * @param content The content to insert.
 * @param selectable Selection into which the content should be inserted.
 * @param placeOrOffset Sets place or offset of the selection.
 * @returns Range which contains all the performed changes. This is a range that, if removed,
 * would return the model to the state before the insertion. If no changes were preformed by `insertContent`, returns a range collapsed
 * at the insertion position.
 */
export default function insertContent(model: Model, content: Item | DocumentFragment, selectable?: Selection | DocumentSelection): Range;
