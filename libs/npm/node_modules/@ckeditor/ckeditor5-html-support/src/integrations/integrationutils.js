/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/integrations/integrationutils
 */
/**
 * Returns the first view element descendant matching the given view name.
 * Includes view element itself.
 *
 * @internal
 */
export function getDescendantElement(writer, containerElement, elementName) {
    const range = writer.createRangeOn(containerElement);
    for (const { item } of range.getWalker()) {
        if (item.is('element', elementName)) {
            return item;
        }
    }
}
