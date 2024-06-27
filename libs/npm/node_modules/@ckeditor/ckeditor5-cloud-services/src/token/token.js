/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module cloud-services/token/token
 */
/* globals XMLHttpRequest, setTimeout, clearTimeout, atob */
import { ObservableMixin, CKEditorError } from 'ckeditor5/src/utils.js';
const DEFAULT_OPTIONS = { autoRefresh: true };
const DEFAULT_TOKEN_REFRESH_TIMEOUT_TIME = 3600000;
/**
 * Class representing the token used for communication with CKEditor Cloud Services.
 * Value of the token is retrieving from the specified URL and is refreshed every 1 hour by default.
 */
export default class Token extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates `Token` instance.
     * Method `init` should be called after using the constructor or use `create` method instead.
     *
     * @param tokenUrlOrRefreshToken Endpoint address to download the token or a callback that provides the token. If the
     * value is a function it has to match the {@link module:cloud-services/token/token~Token#refreshToken} interface.
     */
    constructor(tokenUrlOrRefreshToken, options = {}) {
        super();
        if (!tokenUrlOrRefreshToken) {
            /**
             * A `tokenUrl` must be provided as the first constructor argument.
             *
             * @error token-missing-token-url
             */
            throw new CKEditorError('token-missing-token-url', this);
        }
        if (options.initValue) {
            this._validateTokenValue(options.initValue);
        }
        this.set('value', options.initValue);
        if (typeof tokenUrlOrRefreshToken === 'function') {
            this._refresh = tokenUrlOrRefreshToken;
        }
        else {
            this._refresh = () => defaultRefreshToken(tokenUrlOrRefreshToken);
        }
        this._options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Initializes the token.
     */
    init() {
        return new Promise((resolve, reject) => {
            if (!this.value) {
                this.refreshToken()
                    .then(resolve)
                    .catch(reject);
                return;
            }
            if (this._options.autoRefresh) {
                this._registerRefreshTokenTimeout();
            }
            resolve(this);
        });
    }
    /**
     * Refresh token method. Useful in a method form as it can be override in tests.
     */
    refreshToken() {
        return this._refresh()
            .then(value => {
            this._validateTokenValue(value);
            this.set('value', value);
            if (this._options.autoRefresh) {
                this._registerRefreshTokenTimeout();
            }
            return this;
        });
    }
    /**
     * Destroys token instance. Stops refreshing.
     */
    destroy() {
        clearTimeout(this._tokenRefreshTimeout);
    }
    /**
     * Checks whether the provided token follows the JSON Web Tokens (JWT) format.
     *
     * @param tokenValue The token to validate.
     */
    _validateTokenValue(tokenValue) {
        // The token must be a string.
        const isString = typeof tokenValue === 'string';
        // The token must be a plain string without quotes ("").
        const isPlainString = !/^".*"$/.test(tokenValue);
        // JWT token contains 3 parts: header, payload, and signature.
        // Each part is separated by a dot.
        const isJWTFormat = isString && tokenValue.split('.').length === 3;
        if (!(isPlainString && isJWTFormat)) {
            /**
             * The provided token must follow the [JSON Web Tokens](https://jwt.io/introduction/) format.
             *
             * @error token-not-in-jwt-format
             */
            throw new CKEditorError('token-not-in-jwt-format', this);
        }
    }
    /**
     * Registers a refresh token timeout for the time taken from token.
     */
    _registerRefreshTokenTimeout() {
        const tokenRefreshTimeoutTime = this._getTokenRefreshTimeoutTime();
        clearTimeout(this._tokenRefreshTimeout);
        this._tokenRefreshTimeout = setTimeout(() => {
            this.refreshToken();
        }, tokenRefreshTimeoutTime);
    }
    /**
     * Returns token refresh timeout time calculated from expire time in the token payload.
     *
     * If the token parse fails or the token payload doesn't contain, the default DEFAULT_TOKEN_REFRESH_TIMEOUT_TIME is returned.
     */
    _getTokenRefreshTimeoutTime() {
        try {
            const [, binaryTokenPayload] = this.value.split('.');
            const { exp: tokenExpireTime } = JSON.parse(atob(binaryTokenPayload));
            if (!tokenExpireTime) {
                return DEFAULT_TOKEN_REFRESH_TIMEOUT_TIME;
            }
            const tokenRefreshTimeoutTime = Math.floor(((tokenExpireTime * 1000) - Date.now()) / 2);
            return tokenRefreshTimeoutTime;
        }
        catch (err) {
            return DEFAULT_TOKEN_REFRESH_TIMEOUT_TIME;
        }
    }
    /**
     * Creates a initialized {@link module:cloud-services/token/token~Token} instance.
     *
     * @param tokenUrlOrRefreshToken Endpoint address to download the token or a callback that provides the token. If the
     * value is a function it has to match the {@link module:cloud-services/token/token~Token#refreshToken} interface.
     */
    static create(tokenUrlOrRefreshToken, options = {}) {
        const token = new Token(tokenUrlOrRefreshToken, options);
        return token.init();
    }
}
/**
 * This function is called in a defined interval by the {@link ~Token} class. It also can be invoked manually.
 * It should return a promise, which resolves with the new token value.
 * If any error occurs it should return a rejected promise with an error message.
 */
function defaultRefreshToken(tokenUrl) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', tokenUrl);
        xhr.addEventListener('load', () => {
            const statusCode = xhr.status;
            const xhrResponse = xhr.response;
            if (statusCode < 200 || statusCode > 299) {
                /**
                 * Cannot download new token from the provided url.
                 *
                 * @error token-cannot-download-new-token
                 */
                return reject(new CKEditorError('token-cannot-download-new-token', null));
            }
            return resolve(xhrResponse);
        });
        xhr.addEventListener('error', () => reject(new Error('Network Error')));
        xhr.addEventListener('abort', () => reject(new Error('Abort')));
        xhr.send();
    });
}
