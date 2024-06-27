/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/menubar/menubarmenubuttonview
 */
import IconView from '../icon/iconview.js';
import ButtonView from '../button/buttonview.js';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import '../../theme/components/menubar/menubarmenubutton.css';
/**
 * A menu {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#buttonView} class. Buttons like this one
 * open both top-level bar menus as well as sub-menus.
 */
export default class MenuBarMenuButtonView extends ButtonView {
    /**
     * An icon that displays an arrow to indicate a direction of the menu.
     */
    readonly arrowView: IconView;
    /**
     * Creates an instance of the menu bar button view.
     *
     * @param locale The localization services instance.
     */
    constructor(locale: Locale);
    /**
     * @inheritDoc
     */
    render(): void;
    /**
     * Creates the {@link #arrowView} instance.
     */
    private _createArrowView;
}
