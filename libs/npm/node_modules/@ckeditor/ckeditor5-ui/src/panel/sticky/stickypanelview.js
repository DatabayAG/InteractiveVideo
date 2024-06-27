/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/panel/sticky/stickypanelview
 */
import View from '../../view.js';
import Template from '../../template.js';
import { global, toUnit, Rect } from '@ckeditor/ckeditor5-utils';
// @if CK_DEBUG_STICKYPANEL // const {
// @if CK_DEBUG_STICKYPANEL // 	default: RectDrawer,
// @if CK_DEBUG_STICKYPANEL // 	diagonalStylesBlack
// @if CK_DEBUG_STICKYPANEL // } = require( '@ckeditor/ckeditor5-utils/tests/_utils/rectdrawer' );
import '../../../theme/components/panel/stickypanel.css';
const toPx = /* #__PURE__ */ toUnit('px');
/**
 * The sticky panel view class.
 */
export default class StickyPanelView extends View {
    /**
     * @inheritDoc
     */
    constructor(locale) {
        super(locale);
        const bind = this.bindTemplate;
        this.set('isActive', false);
        this.set('isSticky', false);
        this.set('limiterElement', null);
        this.set('limiterBottomOffset', 50);
        this.set('viewportTopOffset', 0);
        this.set('_marginLeft', null);
        this.set('_isStickyToTheBottomOfLimiter', false);
        this.set('_stickyTopOffset', null);
        this.set('_stickyBottomOffset', null);
        this.content = this.createCollection();
        this._contentPanelPlaceholder = new Template({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel__placeholder'
                ],
                style: {
                    display: bind.to('isSticky', isSticky => isSticky ? 'block' : 'none'),
                    height: bind.to('isSticky', isSticky => {
                        return isSticky ? toPx(this._contentPanelRect.height) : null;
                    })
                }
            }
        }).render();
        this.contentPanelElement = new Template({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel__content',
                    // Toggle class of the panel when "sticky" state changes in the view.
                    bind.if('isSticky', 'ck-sticky-panel__content_sticky'),
                    bind.if('_isStickyToTheBottomOfLimiter', 'ck-sticky-panel__content_sticky_bottom-limit')
                ],
                style: {
                    width: bind.to('isSticky', isSticky => {
                        return isSticky ? toPx(this._contentPanelPlaceholder.getBoundingClientRect().width) : null;
                    }),
                    top: bind.to('_stickyTopOffset', value => value ? toPx(value) : value),
                    bottom: bind.to('_stickyBottomOffset', value => value ? toPx(value) : value),
                    marginLeft: bind.to('_marginLeft')
                }
            },
            children: this.content
        }).render();
        this.setTemplate({
            tag: 'div',
            attributes: {
                class: [
                    'ck',
                    'ck-sticky-panel'
                ]
            },
            children: [
                this._contentPanelPlaceholder,
                this.contentPanelElement
            ]
        });
    }
    /**
     * @inheritDoc
     */
    render() {
        super.render();
        // Check if the panel should go into the sticky state immediately.
        this.checkIfShouldBeSticky();
        // Update sticky state of the panel as the window and ancestors are being scrolled.
        this.listenTo(global.document, 'scroll', () => {
            this.checkIfShouldBeSticky();
        }, { useCapture: true });
        // Synchronize with `model.isActive` because sticking an inactive panel is pointless.
        this.listenTo(this, 'change:isActive', () => {
            this.checkIfShouldBeSticky();
        });
    }
    /**
     * Analyzes the environment to decide whether the panel should be sticky or not.
     * Then handles the positioning of the panel.
     */
    checkIfShouldBeSticky() {
        // @if CK_DEBUG_STICKYPANEL // RectDrawer.clear();
        if (!this.limiterElement || !this.isActive) {
            this._unstick();
            return;
        }
        const limiterRect = new Rect(this.limiterElement);
        let visibleLimiterRect = limiterRect.getVisible();
        if (visibleLimiterRect) {
            const windowRect = new Rect(global.window);
            windowRect.top += this.viewportTopOffset;
            windowRect.height -= this.viewportTopOffset;
            visibleLimiterRect = visibleLimiterRect.getIntersection(windowRect);
        }
        // @if CK_DEBUG_STICKYPANEL // if ( visibleLimiterRect ) {
        // @if CK_DEBUG_STICKYPANEL // 	RectDrawer.draw( visibleLimiterRect,
        // @if CK_DEBUG_STICKYPANEL // 		{ outlineWidth: '3px', opacity: '.8', outlineColor: 'red', outlineOffset: '-3px' },
        // @if CK_DEBUG_STICKYPANEL // 		'Visible anc'
        // @if CK_DEBUG_STICKYPANEL // 	);
        // @if CK_DEBUG_STICKYPANEL // }
        // @if CK_DEBUG_STICKYPANEL //
        // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( limiterRect,
        // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '3px', opacity: '.8', outlineColor: 'green', outlineOffset: '-3px' },
        // @if CK_DEBUG_STICKYPANEL // 	'Limiter'
        // @if CK_DEBUG_STICKYPANEL // );
        // Stick the panel only if
        // * the limiter's ancestors are intersecting with each other so that some of their rects are visible,
        // * and the limiter's top edge is above the visible ancestors' top edge.
        if (visibleLimiterRect && limiterRect.top < visibleLimiterRect.top) {
            // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( visibleLimiterRect,
            // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '3px', opacity: '.8', outlineColor: 'fuchsia', outlineOffset: '-3px',
            // @if CK_DEBUG_STICKYPANEL // 		backgroundColor: 'rgba(255, 0, 255, .3)' },
            // @if CK_DEBUG_STICKYPANEL // 	'Visible limiter'
            // @if CK_DEBUG_STICKYPANEL // );
            const visibleLimiterTop = visibleLimiterRect.top;
            // Check if there's a change the panel can be sticky to the bottom of the limiter.
            if (visibleLimiterTop + this._contentPanelRect.height + this.limiterBottomOffset > visibleLimiterRect.bottom) {
                const stickyBottomOffset = Math.max(limiterRect.bottom - visibleLimiterRect.bottom, 0) + this.limiterBottomOffset;
                // @if CK_DEBUG_STICKYPANEL // const stickyBottomOffsetRect = new Rect( {
                // @if CK_DEBUG_STICKYPANEL // 	top: limiterRect.bottom - stickyBottomOffset, left: 0, right: 2000,
                // @if CK_DEBUG_STICKYPANEL // 	bottom: limiterRect.bottom - stickyBottomOffset, width: 2000, height: 1
                // @if CK_DEBUG_STICKYPANEL // } );
                // @if CK_DEBUG_STICKYPANEL // RectDrawer.draw( stickyBottomOffsetRect,
                // @if CK_DEBUG_STICKYPANEL // 	{ outlineWidth: '1px', opacity: '.8', outlineColor: 'black' },
                // @if CK_DEBUG_STICKYPANEL // 	'Sticky bottom offset'
                // @if CK_DEBUG_STICKYPANEL // );
                // Check if sticking the panel to the bottom of the limiter does not cause it to suddenly
                // move upwards if there's not enough space for it.
                if (limiterRect.bottom - stickyBottomOffset > limiterRect.top + this._contentPanelRect.height) {
                    this._stickToBottomOfLimiter(stickyBottomOffset);
                }
                else {
                    this._unstick();
                }
            }
            else {
                if (this._contentPanelRect.height + this.limiterBottomOffset < limiterRect.height) {
                    this._stickToTopOfAncestors(visibleLimiterTop);
                }
                else {
                    this._unstick();
                }
            }
        }
        else {
            this._unstick();
        }
        // @if CK_DEBUG_STICKYPANEL // console.clear();
        // @if CK_DEBUG_STICKYPANEL // console.log( 'isSticky', this.isSticky );
        // @if CK_DEBUG_STICKYPANEL // console.log( '_isStickyToTheBottomOfLimiter', this._isStickyToTheBottomOfLimiter );
        // @if CK_DEBUG_STICKYPANEL // console.log( '_stickyTopOffset', this._stickyTopOffset );
        // @if CK_DEBUG_STICKYPANEL // console.log( '_stickyBottomOffset', this._stickyBottomOffset );
        // @if CK_DEBUG_STICKYPANEL // if ( visibleLimiterRect ) {
        // @if CK_DEBUG_STICKYPANEL // 	RectDrawer.draw( visibleLimiterRect,
        // @if CK_DEBUG_STICKYPANEL // 		{ ...diagonalStylesBlack,
        // @if CK_DEBUG_STICKYPANEL // 			outlineWidth: '3px', opacity: '.8', outlineColor: 'orange', outlineOffset: '-3px',
        // @if CK_DEBUG_STICKYPANEL // 			backgroundColor: 'rgba(0, 0, 255, .2)' },
        // @if CK_DEBUG_STICKYPANEL // 		'visibleLimiterRect'
        // @if CK_DEBUG_STICKYPANEL // 	);
        // @if CK_DEBUG_STICKYPANEL // }
    }
    /**
     * Sticks the panel at the given CSS `top` offset.
     *
     * @private
     * @param topOffset
     */
    _stickToTopOfAncestors(topOffset) {
        this.isSticky = true;
        this._isStickyToTheBottomOfLimiter = false;
        this._stickyTopOffset = topOffset;
        this._stickyBottomOffset = null;
        this._marginLeft = toPx(-global.window.scrollX);
    }
    /**
     * Sticks the panel at the bottom of the limiter with a given CSS `bottom` offset.
     *
     * @private
     * @param stickyBottomOffset
     */
    _stickToBottomOfLimiter(stickyBottomOffset) {
        this.isSticky = true;
        this._isStickyToTheBottomOfLimiter = true;
        this._stickyTopOffset = null;
        this._stickyBottomOffset = stickyBottomOffset;
        this._marginLeft = toPx(-global.window.scrollX);
    }
    /**
     * Unsticks the panel putting it back to its original position.
     *
     * @private
     */
    _unstick() {
        this.isSticky = false;
        this._isStickyToTheBottomOfLimiter = false;
        this._stickyTopOffset = null;
        this._stickyBottomOffset = null;
        this._marginLeft = null;
    }
    /**
     * Returns the bounding rect of the {@link #contentPanelElement}.
     *
     * @private
     */
    get _contentPanelRect() {
        return new Rect(this.contentPanelElement);
    }
}
