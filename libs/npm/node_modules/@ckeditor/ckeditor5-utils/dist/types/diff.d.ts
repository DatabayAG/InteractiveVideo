/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Calculates the difference between two arrays or strings producing an array containing a list of changes
 * necessary to transform input into output.
 *
 * ```ts
 * diff( 'aba', 'acca' ); // [ 'equal', 'insert', 'insert', 'delete', 'equal' ]
 * ```
 *
 * This function is based on the "O(NP) Sequence Comparison Algorithm" by Sun Wu, Udi Manber, Gene Myers, Webb Miller.
 * Unfortunately, while it gives the most precise results, its to complex for longer strings/arrow (above 200 items).
 * Therefore, `diff()` automatically switches to {@link module:utils/fastdiff~fastDiff `fastDiff()`} when detecting
 * such a scenario. The return formats of both functions are identical.
 *
 * @param a Input array or string.
 * @param b Output array or string.
 * @param cmp Optional function used to compare array values, by default === is used.
 * @returns Array of changes.
 */
declare function diff<T>(a: ArrayLike<T>, b: ArrayLike<T>, cmp?: (a: T, b: T) => boolean): Array<DiffResult>;
declare namespace diff {
    var fastDiff: typeof import("./fastdiff.js").default;
}
export default diff;
/**
 * The element of the result of {@link module:utils/diff~diff} function.
 */
export type DiffResult = 'equal' | 'insert' | 'delete';
