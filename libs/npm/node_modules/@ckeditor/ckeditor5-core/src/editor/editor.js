/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module core/editor/editor
 */
import { Config, CKEditorError, ObservableMixin } from '@ckeditor/ckeditor5-utils';
import { Conversion, DataController, EditingController, Model, StylesProcessor } from '@ckeditor/ckeditor5-engine';
import { ContextWatchdog, EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import Context from '../context.js';
import PluginCollection from '../plugincollection.js';
import CommandCollection from '../commandcollection.js';
import EditingKeystrokeHandler from '../editingkeystrokehandler.js';
import Accessibility from '../accessibility.js';
/**
 * The class representing a basic, generic editor.
 *
 * Check out the list of its subclasses to learn about specific editor implementations.
 *
 * All editor implementations (like {@link module:editor-classic/classiceditor~ClassicEditor} or
 * {@link module:editor-inline/inlineeditor~InlineEditor}) should extend this class. They can add their
 * own methods and properties.
 *
 * When you are implementing a plugin, this editor represents the API
 * which your plugin can expect to get when using its {@link module:core/plugin~Plugin#editor} property.
 *
 * This API should be sufficient in order to implement the "editing" part of your feature
 * (schema definition, conversion, commands, keystrokes, etc.).
 * It does not define the editor UI, which is available only if
 * the specific editor implements also the {@link ~Editor#ui} property
 * (as most editor implementations do).
 */
class Editor extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates a new instance of the editor class.
     *
     * Usually, not to be used directly. See the static {@link module:core/editor/editor~Editor.create `create()`} method.
     *
     * @param config The editor configuration.
     */
    constructor(config = {}) {
        super();
        const constructor = this.constructor;
        // We don't pass translations to the config, because its behavior of splitting keys
        // with dots (e.g. `resize.width` => `resize: { width }`) breaks the translations.
        const { translations: defaultTranslations, ...defaultConfig } = constructor.defaultConfig || {};
        const { translations = defaultTranslations, ...rest } = config;
        // Prefer the language passed as the argument to the constructor instead of the constructor's `defaultConfig`, if both are set.
        const language = config.language || defaultConfig.language;
        this._context = config.context || new Context({ language, translations });
        this._context._addEditor(this, !config.context);
        // Clone the plugins to make sure that the plugin array will not be shared
        // between editors and make the watchdog feature work correctly.
        const availablePlugins = Array.from(constructor.builtinPlugins || []);
        this.config = new Config(rest, defaultConfig);
        this.config.define('plugins', availablePlugins);
        this.config.define(this._context._getEditorConfig());
        this.plugins = new PluginCollection(this, availablePlugins, this._context.plugins);
        this.locale = this._context.locale;
        this.t = this.locale.t;
        this._readOnlyLocks = new Set();
        this.commands = new CommandCollection();
        this.set('state', 'initializing');
        this.once('ready', () => (this.state = 'ready'), { priority: 'high' });
        this.once('destroy', () => (this.state = 'destroyed'), { priority: 'high' });
        this.model = new Model();
        this.on('change:isReadOnly', () => {
            this.model.document.isReadOnly = this.isReadOnly;
        });
        const stylesProcessor = new StylesProcessor();
        this.data = new DataController(this.model, stylesProcessor);
        this.editing = new EditingController(this.model, stylesProcessor);
        this.editing.view.document.bind('isReadOnly').to(this);
        this.conversion = new Conversion([this.editing.downcastDispatcher, this.data.downcastDispatcher], this.data.upcastDispatcher);
        this.conversion.addAlias('dataDowncast', this.data.downcastDispatcher);
        this.conversion.addAlias('editingDowncast', this.editing.downcastDispatcher);
        this.keystrokes = new EditingKeystrokeHandler(this);
        this.keystrokes.listenTo(this.editing.view.document);
        this.accessibility = new Accessibility(this);
    }
    /**
     * Defines whether the editor is in the read-only mode.
     *
     * In read-only mode the editor {@link #commands commands} are disabled so it is not possible
     * to modify the document by using them. Also, the editable element(s) become non-editable.
     *
     * In order to make the editor read-only, you need to call the {@link #enableReadOnlyMode} method:
     *
     * ```ts
     * editor.enableReadOnlyMode( 'feature-id' );
     * ```
     *
     * Later, to turn off the read-only mode, call {@link #disableReadOnlyMode}:
     *
     * ```ts
     * editor.disableReadOnlyMode( 'feature-id' );
     * ```
     *
     * @readonly
     * @observable
     */
    get isReadOnly() {
        return this._readOnlyLocks.size > 0;
    }
    set isReadOnly(value) {
        /**
         * The {@link module:core/editor/editor~Editor#isReadOnly Editor#isReadOnly} property is read-only since version `34.0.0`
         * and can be set only using {@link module:core/editor/editor~Editor#enableReadOnlyMode `Editor#enableReadOnlyMode( lockId )`} and
         * {@link module:core/editor/editor~Editor#disableReadOnlyMode `Editor#disableReadOnlyMode( lockId )`}.
         *
         * Usage before version `34.0.0`:
         *
         * ```ts
         * editor.isReadOnly = true;
         * editor.isReadOnly = false;
         * ```
         *
         * Usage since version `34.0.0`:
         *
         * ```ts
         * editor.enableReadOnlyMode( 'my-feature-id' );
         * editor.disableReadOnlyMode( 'my-feature-id' );
         * ```
         *
         * @error editor-isreadonly-has-no-setter
         */
        throw new CKEditorError('editor-isreadonly-has-no-setter');
    }
    /**
     * Turns on the read-only mode in the editor.
     *
     * Editor can be switched to or out of the read-only mode by many features, under various circumstances. The editor supports locking
     * mechanism for the read-only mode. It enables easy control over the read-only mode when many features wants to turn it on or off at
     * the same time, without conflicting with each other. It guarantees that you will not make the editor editable accidentally (which
     * could lead to errors).
     *
     * Each read-only mode request is identified by a unique id (also called "lock"). If multiple plugins requested to turn on the
     * read-only mode, then, the editor will become editable only after all these plugins turn the read-only mode off (using the same ids).
     *
     * Note, that you cannot force the editor to disable the read-only mode if other plugins set it.
     *
     * After the first `enableReadOnlyMode()` call, the {@link #isReadOnly `isReadOnly` property} will be set to `true`:
     *
     * ```ts
     * editor.isReadOnly; // `false`.
     * editor.enableReadOnlyMode( 'my-feature-id' );
     * editor.isReadOnly; // `true`.
     * ```
     *
     * You can turn off the read-only mode ("clear the lock") using the {@link #disableReadOnlyMode `disableReadOnlyMode()`} method:
     *
     * ```ts
     * editor.enableReadOnlyMode( 'my-feature-id' );
     * // ...
     * editor.disableReadOnlyMode( 'my-feature-id' );
     * editor.isReadOnly; // `false`.
     * ```
     *
     * All "locks" need to be removed to enable editing:
     *
     * ```ts
     * editor.enableReadOnlyMode( 'my-feature-id' );
     * editor.enableReadOnlyMode( 'my-other-feature-id' );
     * // ...
     * editor.disableReadOnlyMode( 'my-feature-id' );
     * editor.isReadOnly; // `true`.
     * editor.disableReadOnlyMode( 'my-other-feature-id' );
     * editor.isReadOnly; // `false`.
     * ```
     *
     * @param lockId A unique ID for setting the editor to the read-only state.
     */
    enableReadOnlyMode(lockId) {
        if (typeof lockId !== 'string' && typeof lockId !== 'symbol') {
            /**
             * The lock ID is missing or it is not a string or symbol.
             *
             * @error editor-read-only-lock-id-invalid
             */
            throw new CKEditorError('editor-read-only-lock-id-invalid', null, { lockId });
        }
        if (this._readOnlyLocks.has(lockId)) {
            return;
        }
        this._readOnlyLocks.add(lockId);
        if (this._readOnlyLocks.size === 1) {
            // Manually fire the `change:isReadOnly` event as only getter is provided.
            this.fire('change:isReadOnly', 'isReadOnly', true, false);
        }
    }
    /**
     * Removes the read-only lock from the editor with given lock ID.
     *
     * When no lock is present on the editor anymore, then the {@link #isReadOnly `isReadOnly` property} will be set to `false`.
     *
     * @param lockId The lock ID for setting the editor to the read-only state.
     */
    disableReadOnlyMode(lockId) {
        if (typeof lockId !== 'string' && typeof lockId !== 'symbol') {
            throw new CKEditorError('editor-read-only-lock-id-invalid', null, { lockId });
        }
        if (!this._readOnlyLocks.has(lockId)) {
            return;
        }
        this._readOnlyLocks.delete(lockId);
        if (this._readOnlyLocks.size === 0) {
            // Manually fire the `change:isReadOnly` event as only getter is provided.
            this.fire('change:isReadOnly', 'isReadOnly', false, true);
        }
    }
    /**
     * Sets the data in the editor.
     *
     * ```ts
     * editor.setData( '<p>This is editor!</p>' );
     * ```
     *
     * If your editor implementation uses multiple roots, you should pass an object with keys corresponding
     * to the editor root names and values equal to the data that should be set in each root:
     *
     * ```ts
     * editor.setData( {
     *     header: '<p>Content for header part.</p>',
     *     content: '<p>Content for main part.</p>',
     *     footer: '<p>Content for footer part.</p>'
     * } );
     * ```
     *
     * By default the editor accepts HTML. This can be controlled by injecting a different data processor.
     * See the {@glink features/markdown Markdown output} guide for more details.
     *
     * @param data Input data.
     */
    setData(data) {
        this.data.set(data);
    }
    /**
     * Gets the data from the editor.
     *
     * ```ts
     * editor.getData(); // -> '<p>This is editor!</p>'
     * ```
     *
     * If your editor implementation uses multiple roots, you should pass root name as one of the options:
     *
     * ```ts
     * editor.getData( { rootName: 'header' } ); // -> '<p>Content for header part.</p>'
     * ```
     *
     * By default, the editor outputs HTML. This can be controlled by injecting a different data processor.
     * See the {@glink features/markdown Markdown output} guide for more details.
     *
     * A warning is logged when you try to retrieve data for a detached root, as most probably this is a mistake. A detached root should
     * be treated like it is removed, and you should not save its data. Note, that the detached root data is always an empty string.
     *
     * @param options Additional configuration for the retrieved data.
     * Editor features may introduce more configuration options that can be set through this parameter.
     * @param options.rootName Root name. Defaults to `'main'`.
     * @param options.trim Whether returned data should be trimmed. This option is set to `'empty'` by default,
     * which means that whenever editor content is considered empty, an empty string is returned. To turn off trimming
     * use `'none'`. In such cases exact content will be returned (for example `'<p>&nbsp;</p>'` for an empty editor).
     * @returns Output data.
     */
    getData(options) {
        return this.data.get(options);
    }
    /**
     * Loads and initializes plugins specified in the configuration.
     *
     * @returns A promise which resolves once the initialization is completed, providing an array of loaded plugins.
     */
    initPlugins() {
        const config = this.config;
        const plugins = config.get('plugins');
        const removePlugins = config.get('removePlugins') || [];
        const extraPlugins = config.get('extraPlugins') || [];
        const substitutePlugins = config.get('substitutePlugins') || [];
        return this.plugins.init(plugins.concat(extraPlugins), removePlugins, substitutePlugins);
    }
    /**
     * Destroys the editor instance, releasing all resources used by it.
     *
     * **Note** The editor cannot be destroyed during the initialization phase so if it is called
     * while the editor {@link #state is being initialized}, it will wait for the editor initialization before destroying it.
     *
     * @fires destroy
     * @returns A promise that resolves once the editor instance is fully destroyed.
     */
    destroy() {
        let readyPromise = Promise.resolve();
        if (this.state == 'initializing') {
            readyPromise = new Promise(resolve => this.once('ready', resolve));
        }
        return readyPromise
            .then(() => {
            this.fire('destroy');
            this.stopListening();
            this.commands.destroy();
        })
            .then(() => this.plugins.destroy())
            .then(() => {
            this.model.destroy();
            this.data.destroy();
            this.editing.destroy();
            this.keystrokes.destroy();
        })
            // Remove the editor from the context.
            // When the context was created by this editor, the context will be destroyed.
            .then(() => this._context._removeEditor(this));
    }
    /**
     * Executes the specified command with given parameters.
     *
     * Shorthand for:
     *
     * ```ts
     * editor.commands.get( commandName ).execute( ... );
     * ```
     *
     * @param commandName The name of the command to execute.
     * @param commandParams Command parameters.
     * @returns The value returned by the {@link module:core/commandcollection~CommandCollection#execute `commands.execute()`}.
     */
    execute(commandName, ...commandParams) {
        try {
            return this.commands.execute(commandName, ...commandParams);
        }
        catch (err) {
            // @if CK_DEBUG // throw err;
            /* istanbul ignore next -- @preserve */
            CKEditorError.rethrowUnexpectedError(err, this);
        }
    }
    /**
     * Focuses the editor.
     *
     * **Note** To explicitly focus the editing area of the editor, use the
     * {@link module:engine/view/view~View#focus `editor.editing.view.focus()`} method of the editing view.
     *
     * Check out the {@glink framework/deep-dive/ui/focus-tracking#focus-in-the-editor-ui Focus in the editor UI} section
     * of the {@glink framework/deep-dive/ui/focus-tracking Deep dive into focus tracking} guide to learn more.
     */
    focus() {
        this.editing.view.focus();
    }
    /* istanbul ignore next -- @preserve */
    /**
     * Creates and initializes a new editor instance.
     *
     * This is an abstract method. Every editor type needs to implement its own initialization logic.
     *
     * See the `create()` methods of the existing editor types to learn how to use them:
     *
     * * {@link module:editor-classic/classiceditor~ClassicEditor.create `ClassicEditor.create()`}
     * * {@link module:editor-balloon/ballooneditor~BalloonEditor.create `BalloonEditor.create()`}
     * * {@link module:editor-decoupled/decouplededitor~DecoupledEditor.create `DecoupledEditor.create()`}
     * * {@link module:editor-inline/inlineeditor~InlineEditor.create `InlineEditor.create()`}
     */
    static create(...args) {
        throw new Error('This is an abstract method.');
    }
}
/**
 * The {@link module:core/context~Context} class.
 *
 * Exposed as static editor field for easier access in editor builds.
 */
Editor.Context = Context;
/**
 * The {@link module:watchdog/editorwatchdog~EditorWatchdog} class.
 *
 * Exposed as static editor field for easier access in editor builds.
 */
Editor.EditorWatchdog = EditorWatchdog;
/**
 * The {@link module:watchdog/contextwatchdog~ContextWatchdog} class.
 *
 * Exposed as static editor field for easier access in editor builds.
 */
Editor.ContextWatchdog = ContextWatchdog;
export default Editor;
/**
 * This error is thrown when trying to pass a `<textarea>` element to a `create()` function of an editor class.
 *
 * The only editor type which can be initialized on `<textarea>` elements is
 * the {@glink getting-started/setup/editor-types#classic-editor classic editor}.
 * This editor hides the passed element and inserts its own UI next to it. Other types of editors reuse the passed element as their root
 * editable element and therefore `<textarea>` is not appropriate for them. Use a `<div>` or another text container instead:
 *
 * ```html
 * <div id="editor">
 * 	<p>Initial content.</p>
 * </div>
 * ```
 *
 * @error editor-wrong-element
 */
