/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Gets all the style types supported by given list type.
 */
export declare function getAllSupportedStyleTypes(): Array<string>;
/**
 * Checks whether the given list-style-type is supported by numbered or bulleted list.
 */
export declare function getListTypeFromListStyleType(listStyleType: string): 'bulleted' | 'numbered' | null;
/**
 * Converts `type` attribute of `<ul>` or `<ol>` elements to `list-style-type` equivalent.
 */
export declare function getListStyleTypeFromTypeAttribute(value: string): string | null;
/**
 * Converts `list-style-type` style to `type` attribute of `<ul>` or `<ol>` elements.
 */
export declare function getTypeAttributeFromListStyleType(value: string): string | null;
