/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/dropdown/dropdownview
 */
import View from '../view.js';
import { KeystrokeHandler, FocusTracker, getOptimalPosition } from '@ckeditor/ckeditor5-utils';
import '../../theme/components/dropdown/dropdown.css';
/**
 * The dropdown view class. It manages the dropdown button and dropdown panel.
 *
 * In most cases, the easiest way to create a dropdown is by using the {@link module:ui/dropdown/utils~createDropdown}
 * util:
 *
 * ```ts
 * const dropdown = createDropdown( locale );
 *
 * // Configure dropdown's button properties:
 * dropdown.buttonView.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.render();
 *
 * dropdown.panelView.element.textContent = 'Content of the panel';
 *
 * // Will render a dropdown with a panel containing a "Content of the panel" text.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * If you want to add a richer content to the dropdown panel, you can use the {@link module:ui/dropdown/utils~addListToDropdown}
 * and {@link module:ui/dropdown/utils~addToolbarToDropdown} helpers. See more examples in
 * {@link module:ui/dropdown/utils~createDropdown} documentation.
 *
 * If you want to create a completely custom dropdown, then you can compose it manually:
 *
 * ```ts
 * const button = new DropdownButtonView( locale );
 * const panel = new DropdownPanelView( locale );
 * const dropdown = new DropdownView( locale, button, panel );
 *
 * button.set( {
 * 	label: 'A dropdown',
 * 	withText: true
 * } );
 *
 * dropdown.render();
 *
 * panel.element.textContent = 'Content of the panel';
 *
 * // Will render a dropdown with a panel containing a "Content of the panel" text.
 * document.body.appendChild( dropdown.element );
 * ```
 *
 * However, dropdown created this way will contain little behavior. You will need to implement handlers for actions
 * such as {@link module:ui/bindings/clickoutsidehandler~clickOutsideHandler clicking outside an open dropdown}
 * (which should close it) and support for arrow keys inside the panel. Therefore, unless you really know what
 * you do and you really need to do it, it is recommended to use the {@link module:ui/dropdown/utils~createDropdown} helper.
 */
class DropdownView extends View {
    /**
     * Creates an instance of the dropdown.
     *
     * Also see {@link #render}.
     *
     * @param locale The localization services instance.
     */
    constructor(locale, buttonView, panelView) {
        super(locale);
        const bind = this.bindTemplate;
        this.buttonView = buttonView;
        this.panelView = panelView;
        this.set('isOpen', false);
        this.set('isEnabled', true);
        this.set('class', undefined);
        this.set('id', undefined);
        this.set('panelPosition', 'auto');
        // Toggle the visibility of the panel when the dropdown becomes open.
        this.panelView.bind('isVisible').to(this, 'isOpen');
        this.keystrokes = new KeystrokeHandler();
        this.focusTracker = new FocusTracker();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-dropdown',
                    bind.to('class'),
                    bind.if('isEnabled', 'ck-disabled', value => !value)
                ],
                id: bind.to('id'),
                'aria-describedby': bind.to('ariaDescribedById')
            },
            children: [
                buttonView,
                panelView
            ]
        });
        buttonView.extendTemplate({
            attributes: {
                class: [
                    'ck-dropdown__button'
                ],
                'data-cke-tooltip-disabled': bind.to('isOpen')
            }
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        this.focusTracker.add(this.buttonView.element);
        this.focusTracker.add(this.panelView.element);
        // Toggle the dropdown when its button has been clicked.
        this.listenTo(this.buttonView, 'open', () => {
            this.isOpen = !this.isOpen;
        });
        // Let the dropdown control the position of the panel. The position must
        // be updated every time the dropdown is open.
        this.on('change:isOpen', (evt, name, isOpen) => {
            if (!isOpen) {
                return;
            }
            // If "auto", find the best position of the panel to fit into the viewport.
            // Otherwise, simply assign the static position.
            if (this.panelPosition === 'auto') {
                const optimalPanelPosition = DropdownView._getOptimalPosition({
                    element: this.panelView.element,
                    target: this.buttonView.element,
                    fitInViewport: true,
                    positions: this._panelPositions
                });
                this.panelView.position = (optimalPanelPosition ? optimalPanelPosition.name : this._panelPositions[0].name);
            }
            else {
                this.panelView.position = this.panelPosition;
            }
        });
        // Listen for keystrokes coming from within #element.
        this.keystrokes.listenTo(this.element);
        const closeDropdown = (data, cancel) => {
            if (this.isOpen) {
                this.isOpen = false;
                cancel();
            }
        };
        // Open the dropdown panel using the arrow down key, just like with return or space.
        this.keystrokes.set('arrowdown', (data, cancel) => {
            // Don't open if the dropdown is disabled or already open.
            if (this.buttonView.isEnabled && !this.isOpen) {
                this.isOpen = true;
                cancel();
            }
        });
        // Block the right arrow key (until nested dropdowns are implemented).
        this.keystrokes.set('arrowright', (data, cancel) => {
            if (this.isOpen) {
                cancel();
            }
        });
        // Close the dropdown using the arrow left/escape key.
        this.keystrokes.set('arrowleft', closeDropdown);
        this.keystrokes.set('esc', closeDropdown);
    }
    /**
     * Focuses the {@link #buttonView}.
     */
    focus() {
        this.buttonView.focus();
    }
    /**
     * Returns {@link #panelView panel} positions to be used by the
     * {@link module:utils/dom/position~getOptimalPosition `getOptimalPosition()`}
     * utility considering the direction of the language the UI of the editor is displayed in.
     */
    get _panelPositions() {
        const { south, north, southEast, southWest, northEast, northWest, southMiddleEast, southMiddleWest, northMiddleEast, northMiddleWest } = DropdownView.defaultPanelPositions;
        if (this.locale.uiLanguageDirection !== 'rtl') {
            return [
                southEast, southWest, southMiddleEast, southMiddleWest, south,
                northEast, northWest, northMiddleEast, northMiddleWest, north
            ];
        }
        else {
            return [
                southWest, southEast, southMiddleWest, southMiddleEast, south,
                northWest, northEast, northMiddleWest, northMiddleEast, north
            ];
        }
    }
}
/**
 * A set of positioning functions used by the dropdown view to determine
 * the optimal position (i.e. fitting into the browser viewport) of its
 * {@link module:ui/dropdown/dropdownview~DropdownView#panelView panel} when
 * {@link module:ui/dropdown/dropdownview~DropdownView#panelPosition} is set to 'auto'`.
 *
 * The available positioning functions are as follow:
 *
 * **South**
 *
 * * `south`
 *
 * ```
 *			[ Button ]
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 * ```
 *
 * * `southEast`
 *
 * ```
 *		[ Button ]
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 * ```
 *
 * * `southWest`
 *
 * ```
 *		         [ Button ]
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 * ```
 *
 * * `southMiddleEast`
 *
 * ```
 *		  [ Button ]
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 * ```
 *
 * * `southMiddleWest`
 *
 * ```
 *		       [ Button ]
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 * ```
 *
 * **North**
 *
 * * `north`
 *
 * ```
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 *		    [ Button ]
 * ```
 *
 * * `northEast`
 *
 * ```
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 *		[ Button ]
 * ```
 *
 * * `northWest`
 *
 * ```
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 *		         [ Button ]
 * ```
 *
 * * `northMiddleEast`
 *
 * ```
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 *		  [ Button ]
 * ```
 *
 * * `northMiddleWest`
 *
 * ```
 *		+-----------------+
 *		|      Panel      |
 *		+-----------------+
 *		       [ Button ]
 * ```
 *
 * Positioning functions are compatible with {@link module:utils/dom/position~DomPoint}.
 *
 * The name that position function returns will be reflected in dropdown panel's class that
 * controls its placement. See {@link module:ui/dropdown/dropdownview~DropdownView#panelPosition}
 * to learn more.
 */
DropdownView.defaultPanelPositions = {
    south: (buttonRect, panelRect) => {
        return {
            top: buttonRect.bottom,
            left: buttonRect.left - (panelRect.width - buttonRect.width) / 2,
            name: 's'
        };
    },
    southEast: buttonRect => {
        return {
            top: buttonRect.bottom,
            left: buttonRect.left,
            name: 'se'
        };
    },
    southWest: (buttonRect, panelRect) => {
        return {
            top: buttonRect.bottom,
            left: buttonRect.left - panelRect.width + buttonRect.width,
            name: 'sw'
        };
    },
    southMiddleEast: (buttonRect, panelRect) => {
        return {
            top: buttonRect.bottom,
            left: buttonRect.left - (panelRect.width - buttonRect.width) / 4,
            name: 'sme'
        };
    },
    southMiddleWest: (buttonRect, panelRect) => {
        return {
            top: buttonRect.bottom,
            left: buttonRect.left - (panelRect.width - buttonRect.width) * 3 / 4,
            name: 'smw'
        };
    },
    north: (buttonRect, panelRect) => {
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - (panelRect.width - buttonRect.width) / 2,
            name: 'n'
        };
    },
    northEast: (buttonRect, panelRect) => {
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left,
            name: 'ne'
        };
    },
    northWest: (buttonRect, panelRect) => {
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - panelRect.width + buttonRect.width,
            name: 'nw'
        };
    },
    northMiddleEast: (buttonRect, panelRect) => {
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - (panelRect.width - buttonRect.width) / 4,
            name: 'nme'
        };
    },
    northMiddleWest: (buttonRect, panelRect) => {
        return {
            top: buttonRect.top - panelRect.height,
            left: buttonRect.left - (panelRect.width - buttonRect.width) * 3 / 4,
            name: 'nmw'
        };
    }
};
/**
 * A function used to calculate the optimal position for the dropdown panel.
 */
DropdownView._getOptimalPosition = getOptimalPosition;
export default DropdownView;
