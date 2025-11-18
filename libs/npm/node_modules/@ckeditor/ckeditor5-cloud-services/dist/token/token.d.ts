/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import type { TokenUrl } from '../cloudservicesconfig.js';
declare const Token_base: {
    new (): import("ckeditor5/src/utils.js").Observable;
    prototype: import("ckeditor5/src/utils.js").Observable;
};
/**
 * Class representing the token used for communication with CKEditor Cloud Services.
 * Value of the token is retrieving from the specified URL and is refreshed every 1 hour by default.
 */
export default class Token extends /* #__PURE__ */ Token_base {
    /**
     * Value of the token.
     * The value of the token is undefined if `initValue` is not provided or `init` method was not called.
     * `create` method creates token with initialized value from url.
     *
     * @see module:cloud-services/token/token~InitializedToken
     * @observable
     * @readonly
     */
    value: string | undefined;
    /**
     * Base refreshing function.
     */
    private _refresh;
    private _options;
    private _tokenRefreshTimeout?;
    /**
     * Creates `Token` instance.
     * Method `init` should be called after using the constructor or use `create` method instead.
     *
     * @param tokenUrlOrRefreshToken Endpoint address to download the token or a callback that provides the token. If the
     * value is a function it has to match the {@link module:cloud-services/token/token~Token#refreshToken} interface.
     */
    constructor(tokenUrlOrRefreshToken: TokenUrl, options?: TokenOptions);
    /**
     * Initializes the token.
     */
    init(): Promise<InitializedToken>;
    /**
     * Refresh token method. Useful in a method form as it can be override in tests.
     */
    refreshToken(): Promise<InitializedToken>;
    /**
     * Destroys token instance. Stops refreshing.
     */
    destroy(): void;
    /**
     * Checks whether the provided token follows the JSON Web Tokens (JWT) format.
     *
     * @param tokenValue The token to validate.
     */
    private _validateTokenValue;
    /**
     * Registers a refresh token timeout for the time taken from token.
     */
    private _registerRefreshTokenTimeout;
    /**
     * Returns token refresh timeout time calculated from expire time in the token payload.
     *
     * If the token parse fails or the token payload doesn't contain, the default DEFAULT_TOKEN_REFRESH_TIMEOUT_TIME is returned.
     */
    private _getTokenRefreshTimeoutTime;
    /**
     * Creates a initialized {@link module:cloud-services/token/token~Token} instance.
     *
     * @param tokenUrlOrRefreshToken Endpoint address to download the token or a callback that provides the token. If the
     * value is a function it has to match the {@link module:cloud-services/token/token~Token#refreshToken} interface.
     */
    static create(tokenUrlOrRefreshToken: TokenUrl, options?: TokenOptions): Promise<InitializedToken>;
}
/**
 * A {@link ~Token} instance that has been initialized.
 */
export type InitializedToken = Token & {
    value: string;
};
/**
 * Options for creating tokens.
 */
export interface TokenOptions {
    /**
     * Initial value of the token.
     */
    initValue?: string;
    /**
     * Specifies whether to start the refresh automatically.
     *
     * @default true
     */
    autoRefresh?: boolean;
}
export {};
