/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/editorui/poweredby
 */
import type { Editor } from '@ckeditor/ckeditor5-core';
declare const PoweredBy_base: {
    new (): import("@ckeditor/ckeditor5-utils").DomEmitter;
    prototype: import("@ckeditor/ckeditor5-utils").DomEmitter;
};
/**
 * A helper that enables the "powered by" feature in the editor and renders a link to the project's
 * webpage next to the bottom of the editable element (editor root, source editing area, etc.) when the editor is focused.
 *
 * @private
 */
export default class PoweredBy extends /* #__PURE__ */ PoweredBy_base {
    /**
     * Editor instance the helper was created for.
     */
    private readonly editor;
    /**
     * A reference to the balloon panel hosting and positioning the "powered by" link and logo.
     */
    private _balloonView;
    /**
     * A throttled version of the {@link #_showBalloon} method meant for frequent use to avoid performance loss.
     */
    private _showBalloonThrottled;
    /**
     * A reference to the last editable element (root, source editing area, etc.) focused by the user.
     * Since the focus can move to other focusable elements in the UI, this reference allows positioning the balloon over the
     * right element whether the user is typing or using the UI.
     */
    private _lastFocusedEditableElement;
    /**
     * Creates a "powered by" helper for a given editor. The feature is initialized on Editor#ready
     * event.
     *
     * @param editor
     */
    constructor(editor: Editor);
    /**
     * Destroys the "powered by" helper along with its view.
     */
    destroy(): void;
    /**
     * Enables "powered by" label once the editor (ui) is ready.
     */
    private _handleEditorReady;
    /**
     * Creates an instance of the {@link module:ui/panel/balloon/balloonpanelview~BalloonPanelView balloon panel}
     * with the "powered by" view inside ready for positioning.
     */
    private _createBalloonView;
    /**
     * Attempts to display the balloon with the "powered by" view.
     */
    private _showBalloon;
    /**
     * Hides the "powered by" balloon if already visible.
     */
    private _hideBalloon;
    /**
     * Updates the {@link #_lastFocusedEditableElement} based on the state of the global focus tracker.
     */
    private _updateLastFocusedEditableElement;
}
export {};
