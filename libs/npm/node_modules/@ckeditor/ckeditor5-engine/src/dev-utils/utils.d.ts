/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Note: This package is used only internally for debugging purposes and should not be used
 * in other environments. It uses a few special methods not existing in the default
 * building process. That is also why there are no tests for this file.
 *
 * @module engine/dev-utils/utils
 */
/**
 * Helper function, converts a map to the 'key1="value1" key2="value1"' format.
 *
 * @param map Map to convert.
 * @returns Converted map.
 */
export declare function convertMapToTags(map: Iterable<[string, unknown]>): string;
/**
 * Helper function, converts a map to the `{"key1":"value1","key2":"value2"}` format.
 *
 * @param map Map to convert.
 * @returns Converted map.
 */
export declare function convertMapToStringifiedObject(map: Iterable<[string, unknown]>): string;
/**
 * Helper function that stores the `document` state for a given `version`.
 */
export declare function dumpTrees(document: any, version: any): void;
/**
 * Helper function that initializes document dumping.
 */
export declare function initDocumentDumping(document: any): void;
/**
 * Helper function that logs document for the given version.
 */
export declare function logDocument(document: any, version: any): void;
