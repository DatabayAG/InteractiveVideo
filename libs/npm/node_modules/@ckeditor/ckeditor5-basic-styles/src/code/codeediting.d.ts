/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module basic-styles/code/codeediting
 */
import { Plugin } from 'ckeditor5/src/core.js';
import { TwoStepCaretMovement } from 'ckeditor5/src/typing.js';
/**
 * The code editing feature.
 *
 * It registers the `'code'` command and introduces the `code` attribute in the model which renders to the view
 * as a `<code>` element.
 */
export default class CodeEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "CodeEditing";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof TwoStepCaretMovement];
    /**
     * @inheritDoc
     */
    init(): void;
}
