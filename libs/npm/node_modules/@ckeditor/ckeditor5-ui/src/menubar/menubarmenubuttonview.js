/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/menubar/menubarmenubuttonview
 */
import IconView from '../icon/iconview.js';
import ButtonView from '../button/buttonview.js';
import dropdownArrowIcon from '../../theme/icons/dropdown-arrow.svg';
import '../../theme/components/menubar/menubarmenubutton.css';
/**
 * A menu {@link module:ui/menubar/menubarmenuview~MenuBarMenuView#buttonView} class. Buttons like this one
 * open both top-level bar menus as well as sub-menus.
 */
export default class MenuBarMenuButtonView extends ButtonView {
    /**
     * Creates an instance of the menu bar button view.
     *
     * @param locale The localization services instance.
     */
    constructor(locale) {
        super(locale);
        const bind = this.bindTemplate;
        this.set({
            withText: true,
            role: 'menuitem'
        });
        this.arrowView = this._createArrowView();
        this.extendTemplate({
            attributes: {
                class: [
                    'ck-menu-bar__menu__button'
                ],
                'aria-haspopup': true,
                'aria-expanded': this.bindTemplate.to('isOn', value => String(value)),
                'data-cke-tooltip-disabled': bind.to('isOn')
            },
            on: {
                'mouseenter': bind.to('mouseenter')
            }
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        this.children.add(this.arrowView);
    }
    /**
     * Creates the {@link #arrowView} instance.
     */
    _createArrowView() {
        const arrowView = new IconView();
        arrowView.content = dropdownArrowIcon;
        arrowView.extendTemplate({
            attributes: {
                class: 'ck-menu-bar__menu__button__arrow'
            }
        });
        return arrowView;
    }
}
