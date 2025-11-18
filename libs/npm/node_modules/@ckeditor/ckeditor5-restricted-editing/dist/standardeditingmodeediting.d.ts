/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module restricted-editing/standardeditingmodeediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
/**
 * The standard editing mode editing feature.
 *
 * * It introduces the `restrictedEditingException` text attribute that is rendered as
 * a `<span>` element with the `restricted-editing-exception` CSS class.
 * * It registers the `'restrictedEditingException'` command.
 */
export default class StandardEditingModeEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "StandardEditingModeEditing";
    /**
     * @inheritDoc
     */
    init(): void;
}
