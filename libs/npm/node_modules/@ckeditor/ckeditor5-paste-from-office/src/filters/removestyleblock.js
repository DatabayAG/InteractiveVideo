/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Removes `<style>` block added by Google Sheets to a copied content.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */
export default function removeStyleBlock(documentFragment, writer) {
    for (const child of Array.from(documentFragment.getChildren())) {
        if (child.is('element', 'style')) {
            writer.remove(child);
        }
    }
}
