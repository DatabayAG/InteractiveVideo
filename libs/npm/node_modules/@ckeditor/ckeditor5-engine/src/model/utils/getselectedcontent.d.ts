/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type DocumentFragment from '../documentfragment.js';
import type DocumentSelection from '../documentselection.js';
import type Model from '../model.js';
import type Selection from '../selection.js';
/**
 * @module engine/model/utils/getselectedcontent
 */
/**
 * Gets a clone of the selected content.
 *
 * For example, for the following selection:
 *
 * ```html
 * <p>x</p><quote><p>y</p><h>fir[st</h></quote><p>se]cond</p><p>z</p>
 * ```
 *
 * It will return a document fragment with such a content:
 *
 * ```html
 * <quote><h>st</h></quote><p>se</p>
 * ```
 *
 * @param model The model in context of which the selection modification should be performed.
 * @param selection The selection of which content will be returned.
 */
export default function getSelectedContent(model: Model, selection: Selection | DocumentSelection): DocumentFragment;
