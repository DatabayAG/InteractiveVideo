/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Possible states of the key after verification.
 */
export type VerifiedKeyStatus = 'VALID' | 'INVALID';
/**
 * Checks whether the given string contains information that allows you to verify the license status.
 *
 * @param token The string to check.
 * @returns String that represents the state of given `token` parameter.
 */
export default function verifyLicense(token: string | undefined): VerifiedKeyStatus;
