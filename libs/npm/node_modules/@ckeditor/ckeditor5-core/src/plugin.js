/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module core/plugin
 */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { ObservableMixin } from '@ckeditor/ckeditor5-utils';
/**
 * The base class for CKEditor plugin classes.
 */
export default class Plugin extends /* #__PURE__ */ ObservableMixin() {
    /**
     * @inheritDoc
     */
    constructor(editor) {
        super();
        /**
         * Holds identifiers for {@link #forceDisabled} mechanism.
         */
        this._disableStack = new Set();
        this.editor = editor;
        this.set('isEnabled', true);
    }
    /**
     * Disables the plugin.
     *
     * Plugin may be disabled by multiple features or algorithms (at once). When disabling a plugin, unique id should be passed
     * (e.g. feature name). The same identifier should be used when {@link #clearForceDisabled enabling back} the plugin.
     * The plugin becomes enabled only after all features {@link #clearForceDisabled enabled it back}.
     *
     * Disabling and enabling a plugin:
     *
     * ```ts
     * plugin.isEnabled; // -> true
     * plugin.forceDisabled( 'MyFeature' );
     * plugin.isEnabled; // -> false
     * plugin.clearForceDisabled( 'MyFeature' );
     * plugin.isEnabled; // -> true
     * ```
     *
     * Plugin disabled by multiple features:
     *
     * ```ts
     * plugin.forceDisabled( 'MyFeature' );
     * plugin.forceDisabled( 'OtherFeature' );
     * plugin.clearForceDisabled( 'MyFeature' );
     * plugin.isEnabled; // -> false
     * plugin.clearForceDisabled( 'OtherFeature' );
     * plugin.isEnabled; // -> true
     * ```
     *
     * Multiple disabling with the same identifier is redundant:
     *
     * ```ts
     * plugin.forceDisabled( 'MyFeature' );
     * plugin.forceDisabled( 'MyFeature' );
     * plugin.clearForceDisabled( 'MyFeature' );
     * plugin.isEnabled; // -> true
     * ```
     *
     * **Note:** some plugins or algorithms may have more complex logic when it comes to enabling or disabling certain plugins,
     * so the plugin might be still disabled after {@link #clearForceDisabled} was used.
     *
     * @param id Unique identifier for disabling. Use the same id when {@link #clearForceDisabled enabling back} the plugin.
     */
    forceDisabled(id) {
        this._disableStack.add(id);
        if (this._disableStack.size == 1) {
            this.on('set:isEnabled', forceDisable, { priority: 'highest' });
            this.isEnabled = false;
        }
    }
    /**
     * Clears forced disable previously set through {@link #forceDisabled}. See {@link #forceDisabled}.
     *
     * @param id Unique identifier, equal to the one passed in {@link #forceDisabled} call.
     */
    clearForceDisabled(id) {
        this._disableStack.delete(id);
        if (this._disableStack.size == 0) {
            this.off('set:isEnabled', forceDisable);
            this.isEnabled = true;
        }
    }
    /**
     * @inheritDoc
     */
    destroy() {
        this.stopListening();
    }
    /**
     * @inheritDoc
     */
    static get isContextPlugin() {
        return false;
    }
}
/**
 * Helper function that forces plugin to be disabled.
 */
function forceDisable(evt) {
    evt.return = false;
    evt.stop();
}
