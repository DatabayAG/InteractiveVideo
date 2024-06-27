/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type { DowncastWriter, HighlightDescriptor } from '@ckeditor/ckeditor5-engine';
declare const HighlightStack_base: {
    new (): import("@ckeditor/ckeditor5-utils").Emitter;
    prototype: import("@ckeditor/ckeditor5-utils").Emitter;
};
/**
 * Class used to handle the correct order of highlights on elements.
 *
 * When different highlights are applied to same element the correct order should be preserved:
 *
 * * highlight with highest priority should be applied,
 * * if two highlights have same priority - sort by CSS class provided in
 * {@link module:engine/conversion/downcasthelpers~HighlightDescriptor}.
 *
 * This way, highlight will be applied with the same rules it is applied on texts.
 */
export default class HighlightStack extends /* #__PURE__ */ HighlightStack_base {
    private readonly _stack;
    /**
     * Adds highlight descriptor to the stack.
     *
     * @fires change:top
     */
    add(descriptor: HighlightDescriptor, writer: DowncastWriter): void;
    /**
     * Removes highlight descriptor from the stack.
     *
     * @fires change:top
     * @param id Id of the descriptor to remove.
     */
    remove(id: string, writer: DowncastWriter): void;
    /**
     * Inserts a given descriptor in correct place in the stack. It also takes care about updating information
     * when descriptor with same id is already present.
     */
    private _insertDescriptor;
    /**
     * Removes descriptor with given id from the stack.
     *
     * @param id Descriptor's id.
     */
    private _removeDescriptor;
}
/**
 * Fired when top element on {@link module:widget/highlightstack~HighlightStack} has been changed
 *
 * @eventName ~HighlightStack#change:top
 */
export type HighlightStackChangeEvent = {
    name: 'change' | 'change:top';
    args: [HighlightStackChangeEventData];
};
/**
 * Additional information about the change.
 */
export type HighlightStackChangeEventData = {
    /**
     * Old highlight descriptor. It will be `undefined` when first descriptor is added to the stack.
     */
    oldDescriptor: HighlightDescriptor;
    /**
     * New highlight descriptor. It will be `undefined` when last descriptor is removed from the stack.
     */
    newDescriptor: HighlightDescriptor;
    /**
     * View writer that can be used to modify element.
     */
    writer: DowncastWriter;
};
export {};
