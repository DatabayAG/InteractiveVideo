/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module alignment/alignmentui
 */
import { Plugin } from 'ckeditor5/src/core.js';
import type { SupportedOption } from './alignmentconfig.js';
/**
 * The default alignment UI plugin.
 *
 * It introduces the `'alignment:left'`, `'alignment:right'`, `'alignment:center'` and `'alignment:justify'` buttons
 * and the `'alignment'` dropdown.
 */
export default class AlignmentUI extends Plugin {
    /**
     * Returns the localized option titles provided by the plugin.
     *
     * The following localized titles corresponding with
     * {@link module:alignment/alignmentconfig~AlignmentConfig#options} are available:
     *
     * * `'left'`,
     * * `'right'`,
     * * `'center'`,
     * * `'justify'`.
     *
     * @readonly
     */
    get localizedOptionTitles(): Record<SupportedOption, string>;
    /**
     * @inheritDoc
     */
    static get pluginName(): "AlignmentUI";
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Helper method for initializing the button and linking it with an appropriate command.
     *
     * @param option The name of the alignment option for which the button is added.
     */
    private _addButton;
    /**
     * Helper method for creating the button view element.
     *
     * @param locale Editor locale.
     * @param option The name of the alignment option for which the button is added.
     * @param buttonAttrs Optional parameters passed to button view instance.
     */
    private _createButton;
    /**
     * Helper method for initializing the toolnar dropdown and linking it with an appropriate command.
     *
     * @param option The name of the alignment option for which the button is added.
     */
    private _addToolbarDropdown;
    /**
     * Creates a menu for all alignment options to use either in menu bar.
     *
     * @param options Normalized alignment options from config.
     */
    private _addMenuBarMenu;
}
