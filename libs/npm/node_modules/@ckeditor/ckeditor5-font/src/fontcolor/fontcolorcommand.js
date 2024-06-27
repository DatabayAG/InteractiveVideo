/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import FontCommand from '../fontcommand.js';
import { FONT_COLOR } from '../utils.js';
/**
 * The font color command. It is used by {@link module:font/fontcolor/fontcolorediting~FontColorEditing}
 * to apply the font color.
 *
 * ```ts
 * editor.execute( 'fontColor', { value: 'rgb(250, 20, 20)' } );
 * ```
 *
 * **Note**: Executing the command with the `null` value removes the attribute from the model.
 */
export default class FontColorCommand extends FontCommand {
    /**
     * @inheritDoc
     */
    constructor(editor) {
        super(editor, FONT_COLOR);
    }
}
