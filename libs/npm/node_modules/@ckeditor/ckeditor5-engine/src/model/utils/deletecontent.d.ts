/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/model/utils/deletecontent
 */
import DocumentSelection from '../documentselection.js';
import type Model from '../model.js';
import type Selection from '../selection.js';
/**
 * Deletes content of the selection and merge siblings. The resulting selection is always collapsed.
 *
 * **Note:** Use {@link module:engine/model/model~Model#deleteContent} instead of this function.
 * This function is only exposed to be reusable in algorithms
 * which change the {@link module:engine/model/model~Model#deleteContent}
 * method's behavior.
 *
 * @param model The model in context of which the insertion should be performed.
 * @param selection Selection of which the content should be deleted.
 * @param options.leaveUnmerged Whether to merge elements after removing the content of the selection.
 *
 * For example `<heading>x[x</heading><paragraph>y]y</paragraph>` will become:
 *
 * * `<heading>x^y</heading>` with the option disabled (`leaveUnmerged == false`)
 * * `<heading>x^</heading><paragraph>y</paragraph>` with enabled (`leaveUnmerged == true`).
 *
 * Note: {@link module:engine/model/schema~Schema#isObject object} and {@link module:engine/model/schema~Schema#isLimit limit}
 * elements will not be merged.
 *
 * @param options.doNotResetEntireContent Whether to skip replacing the entire content with a
 * paragraph when the entire content was selected.
 *
 * For example `<heading>[x</heading><paragraph>y]</paragraph>` will become:
 *
 * * `<paragraph>^</paragraph>` with the option disabled (`doNotResetEntireContent == false`)
 * * `<heading>^</heading>` with enabled (`doNotResetEntireContent == true`).
 *
 * @param options.doNotAutoparagraph Whether to create a paragraph if after content deletion selection is moved
 * to a place where text cannot be inserted.
 *
 * For example `<paragraph>x</paragraph>[<imageBlock src="foo.jpg"></imageBlock>]` will become:
 *
 * * `<paragraph>x</paragraph><paragraph>[]</paragraph>` with the option disabled (`doNotAutoparagraph == false`)
 * * `<paragraph>x</paragraph>[]` with the option enabled (`doNotAutoparagraph == true`).
 *
 * If you use this option you need to make sure to handle invalid selections yourself or leave
 * them to the selection post-fixer (may not always work).
 *
 * **Note:** If there is no valid position for the selection, the paragraph will always be created:
 *
 * `[<imageBlock src="foo.jpg"></imageBlock>]` -> `<paragraph>[]</paragraph>`.
 */
export default function deleteContent(model: Model, selection: Selection | DocumentSelection, options?: {
    leaveUnmerged?: boolean;
    doNotResetEntireContent?: boolean;
    doNotAutoparagraph?: boolean;
}): void;
