/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module utils/dom/tounit
 */
/**
 * Returns a helper function, which adds a desired trailing
 * `unit` to the passed value.
 *
 * @param unit An unit like "px" or "em".
 */
export default function toUnit(unit) {
    return value => value + unit;
}
