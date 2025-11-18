/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module clipboard/utils/viewtoplaintext
 */
import type { ViewDocumentFragment, ViewItem } from '@ckeditor/ckeditor5-engine';
/**
 * Converts {@link module:engine/view/item~Item view item} and all of its children to plain text.
 *
 * @param viewItem View item to convert.
 * @returns Plain text representation of `viewItem`.
 */
export default function viewToPlainText(viewItem: ViewItem | ViewDocumentFragment): string;
