/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/menubar/menubarmenuview
 */
import { FocusTracker, KeystrokeHandler, getOptimalPosition } from '@ckeditor/ckeditor5-utils';
import MenuBarMenuButtonView from './menubarmenubuttonview.js';
import { MenuBarMenuBehaviors, MenuBarMenuViewPanelPositioningFunctions } from './utils.js';
import View from '../view.js';
import { default as MenuBarMenuPanelView } from './menubarmenupanelview.js';
import '../../theme/components/menubar/menubarmenu.css';
/**
 * A menu view for the {@link module:ui/menubar/menubarview~MenuBarView}. Menus are building blocks of the menu bar,
 * they host other sub-menus and menu items (buttons) that users can interact with.
 */
class MenuBarMenuView extends View {
    /**
     * Creates an instance of the menu view.
     *
     * @param locale The localization services instance.
     */
    constructor(locale) {
        super(locale);
        const bind = this.bindTemplate;
        this.buttonView = new MenuBarMenuButtonView(locale);
        this.buttonView.delegate('mouseenter').to(this);
        this.buttonView.bind('isOn', 'isEnabled').to(this, 'isOpen', 'isEnabled');
        this.panelView = new MenuBarMenuPanelView(locale);
        this.panelView.bind('isVisible').to(this, 'isOpen');
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this.set('isOpen', false);
        this.set('isEnabled', true);
        this.set('panelPosition', 'w');
        this.set('class', undefined);
        this.set('parentMenuView', null);
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-menu-bar__menu',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', value => !value),
                    bind.if('parentMenuView', 'ck-menu-bar__menu_top-level', value => !value)
                ]
            },
            children: [
                this.buttonView,
                this.panelView
            ]
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        this.focusTracker.add(this.buttonView.element);
        this.focusTracker.add(this.panelView.element);
        // Listen for keystrokes coming from within #element.
        this.keystrokes.listenTo(this.element);
        MenuBarMenuBehaviors.closeOnEscKey(this);
        this._repositionPanelOnOpen();
    }
    // For now, this method cannot be called in the render process because the `parentMenuView` may be assigned
    // after the rendering process.
    //
    // TODO: We should reconsider the way we handle this logic.
    /**
     * Attach all keyboard behaviors for the menu bar view.
     *
     * @internal
     */
    _attachBehaviors() {
        // Top-level menus.
        if (!this.parentMenuView) {
            this._propagateArrowKeystrokeEvents();
            MenuBarMenuBehaviors.openAndFocusPanelOnArrowDownKey(this);
            MenuBarMenuBehaviors.toggleOnButtonClick(this);
        }
        else {
            MenuBarMenuBehaviors.openOnButtonClick(this);
            MenuBarMenuBehaviors.openOnArrowRightKey(this);
            MenuBarMenuBehaviors.closeOnArrowLeftKey(this);
            MenuBarMenuBehaviors.closeOnParentClose(this);
        }
    }
    /**
     * Fires `arrowright` and `arrowleft` events when the user pressed corresponding arrow keys.
     */
    _propagateArrowKeystrokeEvents() {
        this.keystrokes.set('arrowright', (data, cancel) => {
            this.fire('arrowright');
            cancel();
        });
        this.keystrokes.set('arrowleft', (data, cancel) => {
            this.fire('arrowleft');
            cancel();
        });
    }
    /**
     * Sets the position of the panel when the menu opens. The panel is positioned
     * so that it optimally uses the available space in the viewport.
     */
    _repositionPanelOnOpen() {
        // Let the menu control the position of the panel. The position must be updated every time the menu is open.
        this.on('change:isOpen', (evt, name, isOpen) => {
            if (!isOpen) {
                return;
            }
            const optimalPanelPosition = MenuBarMenuView._getOptimalPosition({
                element: this.panelView.element,
                target: this.buttonView.element,
                fitInViewport: true,
                positions: this._panelPositions
            });
            this.panelView.position = (optimalPanelPosition ? optimalPanelPosition.name : this._panelPositions[0].name);
        });
    }
    /**
     * @inheritDoc
     */
    focus() {
        this.buttonView.focus();
    }
    /**
     * Positioning functions for the {@link #panelView} . They change depending on the role of the menu (top-level vs sub-menu) in
     * the {@link module:ui/menubar/menubarview~MenuBarView menu bar} and the UI language direction.
     */
    get _panelPositions() {
        const { southEast, southWest, northEast, northWest, westSouth, eastSouth, westNorth, eastNorth } = MenuBarMenuViewPanelPositioningFunctions;
        if (this.locale.uiLanguageDirection === 'ltr') {
            if (this.parentMenuView) {
                return [eastSouth, eastNorth, westSouth, westNorth];
            }
            else {
                return [southEast, southWest, northEast, northWest];
            }
        }
        else {
            if (this.parentMenuView) {
                return [westSouth, westNorth, eastSouth, eastNorth];
            }
            else {
                return [southWest, southEast, northWest, northEast];
            }
        }
    }
}
/**
 * A function used to calculate the optimal position for the dropdown panel.
 *
 * Referenced for unit testing purposes.
 */
MenuBarMenuView._getOptimalPosition = getOptimalPosition;
export default MenuBarMenuView;
