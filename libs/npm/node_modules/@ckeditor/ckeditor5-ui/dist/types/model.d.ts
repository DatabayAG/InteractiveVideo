/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
declare const Model_base: {
    new (): import("@ckeditor/ckeditor5-utils").Observable;
    prototype: import("@ckeditor/ckeditor5-utils").Observable;
};
/**
 * The base MVC model class.
 */
export default class Model extends /* #__PURE__ */ Model_base {
    [x: string]: unknown;
    /**
     * Creates a new Model instance.
     *
     * @param attributes The model state attributes to be defined during the instance creation.
     * @param properties The (out of state) properties to be appended to the instance during creation.
     */
    constructor(attributes?: Record<string, unknown>, properties?: Record<string, unknown>);
}
export {};
