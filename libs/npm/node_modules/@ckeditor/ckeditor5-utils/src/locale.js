/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module utils/locale
 */
/* globals console */
import toArray from './toarray.js';
import { _translate, _unifyTranslations } from './translation-service.js';
import { getLanguageDirection } from './language.js';
/**
 * Represents the localization services.
 */
export default class Locale {
    /**
     * Creates a new instance of the locale class. Learn more about
     * {@glink getting-started/setup/ui-language configuring the language of the editor}.
     *
     * @param options Locale configuration.
     * @param options.uiLanguage The editor UI language code in the
     * [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) format. See {@link #uiLanguage}.
     * @param options.contentLanguage The editor content language code in the
     * [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) format. If not specified, the same as `options.language`.
     * See {@link #contentLanguage}.
     * @param translations Translations passed as a editor config parameter.
     */
    constructor({ uiLanguage = 'en', contentLanguage, translations } = {}) {
        this.uiLanguage = uiLanguage;
        this.contentLanguage = contentLanguage || this.uiLanguage;
        this.uiLanguageDirection = getLanguageDirection(this.uiLanguage);
        this.contentLanguageDirection = getLanguageDirection(this.contentLanguage);
        this.translations = _unifyTranslations(translations);
        this.t = (message, values) => this._t(message, values);
    }
    /**
     * The editor UI language code in the [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) format.
     *
     * **Note**: This property was deprecated. Please use {@link #uiLanguage} and {@link #contentLanguage}
     * properties instead.
     *
     * @deprecated
     */
    get language() {
        /**
         * The {@link module:utils/locale~Locale#language `Locale#language`} property was deprecated and will
         * be removed in the near future. Please use the {@link module:utils/locale~Locale#uiLanguage `Locale#uiLanguage`} and
         * {@link module:utils/locale~Locale#contentLanguage `Locale#contentLanguage`} properties instead.
         *
         * @error locale-deprecated-language-property
         */
        console.warn('locale-deprecated-language-property: ' +
            'The Locale#language property has been deprecated and will be removed in the near future. ' +
            'Please use #uiLanguage and #contentLanguage properties instead.');
        return this.uiLanguage;
    }
    /**
     * An unbound version of the {@link #t} method.
     */
    _t(message, values = []) {
        values = toArray(values);
        if (typeof message === 'string') {
            message = { string: message };
        }
        const hasPluralForm = !!message.plural;
        const quantity = hasPluralForm ? values[0] : 1;
        const translatedString = _translate(this.uiLanguage, message, quantity, this.translations);
        return interpolateString(translatedString, values);
    }
}
/**
 * Fills the `%0, %1, ...` string placeholders with values.
 */
function interpolateString(string, values) {
    return string.replace(/%(\d+)/g, (match, index) => {
        return (index < values.length) ? values[index] : match;
    });
}
