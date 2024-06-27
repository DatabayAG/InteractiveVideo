/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Removes the `width:0px` style from table pasted from Google Sheets.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */
export default function removeInvalidTableWidth(documentFragment, writer) {
    for (const child of documentFragment.getChildren()) {
        if (child.is('element', 'table') && child.getStyle('width') === '0px') {
            writer.removeStyle('width', child);
        }
    }
}
