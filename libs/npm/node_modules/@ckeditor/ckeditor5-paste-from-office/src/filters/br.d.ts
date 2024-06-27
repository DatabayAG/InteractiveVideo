/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module paste-from-office/filters/br
 */
import { type UpcastWriter, type ViewDocumentFragment } from 'ckeditor5/src/engine.js';
/**
 * Transforms `<br>` elements that are siblings to some block element into a paragraphs.
 *
 * @param documentFragment The view structure to be transformed.
 */
export default function transformBlockBrsToParagraphs(documentFragment: ViewDocumentFragment, writer: UpcastWriter): void;
