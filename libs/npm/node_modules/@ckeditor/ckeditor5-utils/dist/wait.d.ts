/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module utils/wait
 */
/**
 * Returns a promise that is resolved after the specified time.
 *
 * @param timeout The time in milliseconds to wait.
 * @param options.signal A signal to abort the waiting.
 */
export default function wait(timeout: number, options?: {
    signal?: AbortSignal;
}): Promise<void>;
