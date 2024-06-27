/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/subscript/subscriptediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The subscript editing feature.
 *
 * It registers the `sub` command and introduces the `sub` attribute in the model which renders to the view
 * as a `<sub>` element.
 */
export default class SubscriptEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "SubscriptEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
