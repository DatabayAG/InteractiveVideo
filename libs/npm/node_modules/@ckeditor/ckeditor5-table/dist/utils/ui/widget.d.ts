/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module table/utils/ui/widget
 */
import type { ViewDocumentSelection, ViewElement } from 'ckeditor5/src/engine.js';
/**
 * Depending on the position of the selection either return the selected table or the table higher in the hierarchy.
 */
export declare function getSelectionAffectedTableWidget(selection: ViewDocumentSelection): ViewElement | null;
/**
 * Returns a table widget editing view element if one is selected.
 */
export declare function getSelectedTableWidget(selection: ViewDocumentSelection): ViewElement | null;
/**
 * Returns a table widget editing view element if one is among the selection's ancestors.
 */
export declare function getTableWidgetAncestor(selection: ViewDocumentSelection): ViewElement | null;
