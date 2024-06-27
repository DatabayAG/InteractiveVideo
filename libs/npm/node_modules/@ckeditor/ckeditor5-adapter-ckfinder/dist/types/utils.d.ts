/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * Returns the CSRF token value. The value is a hash stored in `document.cookie`
 * under the `ckCsrfToken` key. The CSRF token can be used to secure the communication
 * between the web browser and the CKFinder server.
 */
export declare function getCsrfToken(): string;
/**
 * Returns the value of the cookie with a given name or `null` if the cookie is not found.
 */
export declare function getCookie(name: string): string | null;
/**
 * Sets the value of the cookie with a given name.
 */
export declare function setCookie(name: string, value: string): void;
