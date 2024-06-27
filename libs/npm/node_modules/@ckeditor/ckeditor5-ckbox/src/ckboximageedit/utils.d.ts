/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type { Element } from 'ckeditor5/src/engine.js';
import type { CKBoxConfig } from '../ckboxconfig.js';
/**
 * @internal
 */
export declare function createEditabilityChecker(allowExternalImagesEditing: CKBoxConfig['allowExternalImagesEditing']): (element: Element) => boolean;
