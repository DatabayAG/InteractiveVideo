/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { ObservableMixin, insertToPriorityArray, EmitterMixin, CKEditorError, Config, Locale, Collection, KeystrokeHandler, setDataInElement } from '@ckeditor/ckeditor5-utils/dist/index.js';
import { Model, StylesProcessor, DataController, EditingController, Conversion } from '@ckeditor/ckeditor5-engine/dist/index.js';
import { EditorWatchdog, ContextWatchdog } from '@ckeditor/ckeditor5-watchdog/dist/index.js';
import { isFunction } from 'lodash-es';

/**
 * The base class for CKEditor plugin classes.
 */ class Plugin extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * The editor instance.
	 *
	 * Note that most editors implement the {@link module:core/editor/editor~Editor#ui} property.
	 * However, editors with an external UI (i.e. Bootstrap-based) or a headless editor may not have this property or
	 * throw an error when accessing it.
	 *
	 * Because of above, to make plugins more universal, it is recommended to split features into:
	 *  - The "editing" part that uses the {@link module:core/editor/editor~Editor} class without `ui` property.
	 *  - The "UI" part that uses the {@link module:core/editor/editor~Editor} class and accesses `ui` property.
	 */ editor;
    /**
	 * Holds identifiers for {@link #forceDisabled} mechanism.
	 */ _disableStack = new Set();
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super();
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
	 */ forceDisabled(id) {
        this._disableStack.add(id);
        if (this._disableStack.size == 1) {
            this.on('set:isEnabled', forceDisable$1, {
                priority: 'highest'
            });
            this.isEnabled = false;
        }
    }
    /**
	 * Clears forced disable previously set through {@link #forceDisabled}. See {@link #forceDisabled}.
	 *
	 * @param id Unique identifier, equal to the one passed in {@link #forceDisabled} call.
	 */ clearForceDisabled(id) {
        this._disableStack.delete(id);
        if (this._disableStack.size == 0) {
            this.off('set:isEnabled', forceDisable$1);
            this.isEnabled = true;
        }
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        this.stopListening();
    }
    /**
	 * @inheritDoc
	 */ static get isContextPlugin() {
        return false;
    }
}
/**
 * Helper function that forces plugin to be disabled.
 */ function forceDisable$1(evt) {
    evt.return = false;
    evt.stop();
}

/**
 * Base class for the CKEditor commands.
 *
 * Commands are the main way to manipulate the editor contents and state. They are mostly used by UI elements (or by other
 * commands) to make changes in the model. Commands are available in every part of the code that has access to
 * the {@link module:core/editor/editor~Editor editor} instance.
 *
 * Instances of registered commands can be retrieved from {@link module:core/editor/editor~Editor#commands `editor.commands`}.
 * The easiest way to execute a command is through {@link module:core/editor/editor~Editor#execute `editor.execute()`}.
 *
 * By default, commands are disabled when the editor is in the {@link module:core/editor/editor~Editor#isReadOnly read-only} mode
 * but commands with the {@link module:core/command~Command#affectsData `affectsData`} flag set to `false` will not be disabled.
 */ class Command extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * The editor on which this command will be used.
	 */ editor;
    /**
	 * A flag indicating whether a command's `isEnabled` state should be changed depending on where the document
	 * selection is placed.
	 *
	 * By default, it is set to `true`. If the document selection is placed in a
	 * {@link module:engine/model/model~Model#canEditAt non-editable} place (such as non-editable root), the command becomes disabled.
	 *
	 * The flag should be changed to `false` in a concrete command's constructor if the command should not change its `isEnabled`
	 * accordingly to the document selection.
	 */ _isEnabledBasedOnSelection;
    /**
	 * A flag indicating whether a command execution changes the editor data or not.
	 *
	 * @see #affectsData
	 */ _affectsData;
    /**
	 * Holds identifiers for {@link #forceDisabled} mechanism.
	 */ _disableStack;
    /**
	 * Creates a new `Command` instance.
	 *
	 * @param editor The editor on which this command will be used.
	 */ constructor(editor){
        super();
        this.editor = editor;
        this.set('value', undefined);
        this.set('isEnabled', false);
        this._affectsData = true;
        this._isEnabledBasedOnSelection = true;
        this._disableStack = new Set();
        this.decorate('execute');
        // By default, every command is refreshed when changes are applied to the model.
        this.listenTo(this.editor.model.document, 'change', ()=>{
            this.refresh();
        });
        this.listenTo(editor, 'change:isReadOnly', ()=>{
            this.refresh();
        });
        // By default, commands are disabled if the selection is in non-editable place or editor is in read-only mode.
        this.on('set:isEnabled', (evt)=>{
            if (!this.affectsData) {
                return;
            }
            const selection = editor.model.document.selection;
            const selectionInGraveyard = selection.getFirstPosition().root.rootName == '$graveyard';
            const canEditAtSelection = !selectionInGraveyard && editor.model.canEditAt(selection);
            // Disable if editor is read only, or when selection is in a place which cannot be edited.
            //
            // Checking `editor.isReadOnly` is needed for all commands that have `_isEnabledBasedOnSelection == false`.
            // E.g. undo does not base on selection, but affects data and should be disabled when the editor is in read-only mode.
            if (editor.isReadOnly || this._isEnabledBasedOnSelection && !canEditAtSelection) {
                evt.return = false;
                evt.stop();
            }
        }, {
            priority: 'highest'
        });
        this.on('execute', (evt)=>{
            if (!this.isEnabled) {
                evt.stop();
            }
        }, {
            priority: 'high'
        });
    }
    /**
	 * A flag indicating whether a command execution changes the editor data or not.
	 *
	 * Commands with `affectsData` set to `false` will not be automatically disabled in
	 * the {@link module:core/editor/editor~Editor#isReadOnly read-only mode} and
	 * {@glink features/read-only#related-features other editor modes} with restricted user write permissions.
	 *
	 * **Note:** You do not have to set it for your every command. It is `true` by default.
	 *
	 * @default true
	 */ get affectsData() {
        return this._affectsData;
    }
    set affectsData(affectsData) {
        this._affectsData = affectsData;
    }
    /**
	 * Refreshes the command. The command should update its {@link #isEnabled} and {@link #value} properties
	 * in this method.
	 *
	 * This method is automatically called when
	 * {@link module:engine/model/document~Document#event:change any changes are applied to the document}.
	 */ refresh() {
        this.isEnabled = true;
    }
    /**
	 * Disables the command.
	 *
	 * Command may be disabled by multiple features or algorithms (at once). When disabling a command, unique id should be passed
	 * (e.g. the feature name). The same identifier should be used when {@link #clearForceDisabled enabling back} the command.
	 * The command becomes enabled only after all features {@link #clearForceDisabled enabled it back}.
	 *
	 * Disabling and enabling a command:
	 *
	 * ```ts
	 * command.isEnabled; // -> true
	 * command.forceDisabled( 'MyFeature' );
	 * command.isEnabled; // -> false
	 * command.clearForceDisabled( 'MyFeature' );
	 * command.isEnabled; // -> true
	 * ```
	 *
	 * Command disabled by multiple features:
	 *
	 * ```ts
	 * command.forceDisabled( 'MyFeature' );
	 * command.forceDisabled( 'OtherFeature' );
	 * command.clearForceDisabled( 'MyFeature' );
	 * command.isEnabled; // -> false
	 * command.clearForceDisabled( 'OtherFeature' );
	 * command.isEnabled; // -> true
	 * ```
	 *
	 * Multiple disabling with the same identifier is redundant:
	 *
	 * ```ts
	 * command.forceDisabled( 'MyFeature' );
	 * command.forceDisabled( 'MyFeature' );
	 * command.clearForceDisabled( 'MyFeature' );
	 * command.isEnabled; // -> true
	 * ```
	 *
	 * **Note:** some commands or algorithms may have more complex logic when it comes to enabling or disabling certain commands,
	 * so the command might be still disabled after {@link #clearForceDisabled} was used.
	 *
	 * @param id Unique identifier for disabling. Use the same id when {@link #clearForceDisabled enabling back} the command.
	 */ forceDisabled(id) {
        this._disableStack.add(id);
        if (this._disableStack.size == 1) {
            this.on('set:isEnabled', forceDisable, {
                priority: 'highest'
            });
            this.isEnabled = false;
        }
    }
    /**
	 * Clears forced disable previously set through {@link #forceDisabled}. See {@link #forceDisabled}.
	 *
	 * @param id Unique identifier, equal to the one passed in {@link #forceDisabled} call.
	 */ clearForceDisabled(id) {
        this._disableStack.delete(id);
        if (this._disableStack.size == 0) {
            this.off('set:isEnabled', forceDisable);
            this.refresh();
        }
    }
    /**
	 * Executes the command.
	 *
	 * A command may accept parameters. They will be passed from {@link module:core/editor/editor~Editor#execute `editor.execute()`}
	 * to the command.
	 *
	 * The `execute()` method will automatically abort when the command is disabled ({@link #isEnabled} is `false`).
	 * This behavior is implemented by a high priority listener to the {@link #event:execute} event.
	 *
	 * In order to see how to disable a command from "outside" see the {@link #isEnabled} documentation.
	 *
	 * This method may return a value, which would be forwarded all the way down to the
	 * {@link module:core/editor/editor~Editor#execute `editor.execute()`}.
	 *
	 * @fires execute
	 */ execute(...args) {
        return undefined;
    }
    /**
	 * Destroys the command.
	 */ destroy() {
        this.stopListening();
    }
}
/**
 * Helper function that forces command to be disabled.
 */ function forceDisable(evt) {
    evt.return = false;
    evt.stop();
}

/**
 * A CKEditor command that aggregates other commands.
 *
 * This command is used to proxy multiple commands. The multi-command is enabled when
 * at least one of its registered child commands is enabled.
 * When executing a multi-command, the first enabled command with highest priority will be executed.
 *
 * ```ts
 * const multiCommand = new MultiCommand( editor );
 *
 * const commandFoo = new Command( editor );
 * const commandBar = new Command( editor );
 *
 * // Register a child command.
 * multiCommand.registerChildCommand( commandFoo );
 * // Register a child command with a low priority.
 * multiCommand.registerChildCommand( commandBar, { priority: 'low' } );
 *
 * // Enable one of the commands.
 * commandBar.isEnabled = true;
 *
 * multiCommand.execute(); // Will execute commandBar.
 * ```
 */ class MultiCommand extends Command {
    /**
	 * Registered child commands definitions.
	 */ _childCommandsDefinitions = [];
    /**
	 * @inheritDoc
	 */ refresh() {
    // Override base command refresh(): the command's state is changed when one of child commands changes states.
    }
    /**
	 * Executes the first enabled command which has the highest priority of all registered child commands.
	 *
	 * @returns The value returned by the {@link module:core/command~Command#execute `command.execute()`}.
	 */ execute(...args) {
        const command = this._getFirstEnabledCommand();
        return !!command && command.execute(args);
    }
    /**
	 * Registers a child command.
	 *
	 * @param options An object with configuration options.
	 * @param options.priority Priority of a command to register.
	 */ registerChildCommand(command, options = {}) {
        insertToPriorityArray(this._childCommandsDefinitions, {
            command,
            priority: options.priority || 'normal'
        });
        // Change multi-command enabled state when one of registered commands changes state.
        command.on('change:isEnabled', ()=>this._checkEnabled());
        this._checkEnabled();
    }
    /**
	 * Checks if any of child commands is enabled.
	 */ _checkEnabled() {
        this.isEnabled = !!this._getFirstEnabledCommand();
    }
    /**
	 * Returns a first enabled command with the highest priority or `undefined` if none of them is enabled.
	 */ _getFirstEnabledCommand() {
        const commandDefinition = this._childCommandsDefinitions.find(({ command })=>command.isEnabled);
        return commandDefinition && commandDefinition.command;
    }
}

/**
 * Manages a list of CKEditor plugins, including loading, resolving dependencies and initialization.
 */ class PluginCollection extends /* #__PURE__ */ EmitterMixin() {
    _context;
    _plugins = new Map();
    /**
	 * A map of plugin constructors that can be retrieved by their names.
	 */ _availablePlugins;
    /**
	 * Map of {@link module:core/contextplugin~ContextPlugin context plugins} which can be retrieved by their constructors or instances.
	 */ _contextPlugins;
    /**
	 * Creates an instance of the plugin collection class.
	 * Allows loading and initializing plugins and their dependencies.
	 * Allows providing a list of already loaded plugins. These plugins will not be destroyed along with this collection.
	 *
	 * @param availablePlugins Plugins (constructors) which the collection will be able to use
	 * when {@link module:core/plugincollection~PluginCollection#init} is used with the plugin names (strings, instead of constructors).
	 * Usually, the editor will pass its built-in plugins to the collection so they can later be
	 * used in `config.plugins` or `config.removePlugins` by names.
	 * @param contextPlugins A list of already initialized plugins represented by a `[ PluginConstructor, pluginInstance ]` pair.
	 */ constructor(context, availablePlugins = [], contextPlugins = []){
        super();
        this._context = context;
        this._availablePlugins = new Map();
        for (const PluginConstructor of availablePlugins){
            if (PluginConstructor.pluginName) {
                this._availablePlugins.set(PluginConstructor.pluginName, PluginConstructor);
            }
        }
        this._contextPlugins = new Map();
        for (const [PluginConstructor, pluginInstance] of contextPlugins){
            this._contextPlugins.set(PluginConstructor, pluginInstance);
            this._contextPlugins.set(pluginInstance, PluginConstructor);
            // To make it possible to require a plugin by its name.
            if (PluginConstructor.pluginName) {
                this._availablePlugins.set(PluginConstructor.pluginName, PluginConstructor);
            }
        }
    }
    /**
	 * Iterable interface.
	 *
	 * Returns `[ PluginConstructor, pluginInstance ]` pairs.
	 */ *[Symbol.iterator]() {
        for (const entry of this._plugins){
            if (typeof entry[0] == 'function') {
                yield entry;
            }
        }
    }
    /**
	 * Gets the plugin instance by its constructor or name.
	 *
	 * ```ts
	 * // Check if 'Clipboard' plugin was loaded.
	 * if ( editor.plugins.has( 'ClipboardPipeline' ) ) {
	 * 	// Get clipboard plugin instance
	 * 	const clipboard = editor.plugins.get( 'ClipboardPipeline' );
	 *
	 * 	this.listenTo( clipboard, 'inputTransformation', ( evt, data ) => {
	 * 		// Do something on clipboard input.
	 * 	} );
	 * }
	 * ```
	 *
	 * **Note**: This method will throw an error if a plugin is not loaded. Use `{@link #has editor.plugins.has()}`
	 * to check if a plugin is available.
	 *
	 * @param key The plugin constructor or {@link module:core/plugin~PluginStaticMembers#pluginName name}.
	 */ get(key) {
        const plugin = this._plugins.get(key);
        if (!plugin) {
            let pluginName = key;
            if (typeof key == 'function') {
                pluginName = key.pluginName || key.name;
            }
            /**
			 * The plugin is not loaded and could not be obtained.
			 *
			 * Plugin classes (constructors) need to be provided to the editor and must be loaded before they can be obtained from
			 * the plugin collection.
			 *
			 * **Note**: You can use `{@link module:core/plugincollection~PluginCollection#has editor.plugins.has()}`
			 * to check if a plugin was loaded.
			 *
			 * @error plugincollection-plugin-not-loaded
			 * @param plugin The name of the plugin which is not loaded.
			 */ throw new CKEditorError('plugincollection-plugin-not-loaded', this._context, {
                plugin: pluginName
            });
        }
        return plugin;
    }
    /**
	 * Checks if a plugin is loaded.
	 *
	 * ```ts
	 * // Check if the 'Clipboard' plugin was loaded.
	 * if ( editor.plugins.has( 'ClipboardPipeline' ) ) {
	 * 	// Now use the clipboard plugin instance:
	 * 	const clipboard = editor.plugins.get( 'ClipboardPipeline' );
	 *
	 * 	// ...
	 * }
	 * ```
	 *
	 * @param key The plugin constructor or {@link module:core/plugin~PluginStaticMembers#pluginName name}.
	 */ has(key) {
        return this._plugins.has(key);
    }
    /**
	 * Initializes a set of plugins and adds them to the collection.
	 *
	 * @param plugins An array of {@link module:core/plugin~PluginInterface plugin constructors}
	 * or {@link module:core/plugin~PluginStaticMembers#pluginName plugin names}.
	 * @param pluginsToRemove Names of the plugins or plugin constructors
	 * that should not be loaded (despite being specified in the `plugins` array).
	 * @param pluginsSubstitutions An array of {@link module:core/plugin~PluginInterface plugin constructors}
	 * that will be used to replace plugins of the same names that were passed in `plugins` or that are in their dependency tree.
	 * A useful option for replacing built-in plugins while creating tests (for mocking their APIs). Plugins that will be replaced
	 * must follow these rules:
	 *   * The new plugin must be a class.
	 *   * The new plugin must be named.
	 *   * Both plugins must not depend on other plugins.
	 * @returns A promise which gets resolved once all plugins are loaded and available in the collection.
	 */ init(plugins, pluginsToRemove = [], pluginsSubstitutions = []) {
        // Plugin initialization procedure consists of 2 main steps:
        // 1) collecting all available plugin constructors,
        // 2) verification whether all required plugins can be instantiated.
        //
        // In the first step, all plugin constructors, available in the provided `plugins` array and inside
        // plugin's dependencies (from the `Plugin.requires` array), are recursively collected and added to the existing
        // `this._availablePlugins` map, but without any verification at the given moment. Performing the verification
        // at this point (during the plugin constructor searching) would cause false errors to occur, that some plugin
        // is missing but in fact it may be defined further in the array as the dependency of other plugin. After
        // traversing the entire dependency tree, it will be checked if all required "top level" plugins are available.
        //
        // In the second step, the list of plugins that have not been explicitly removed is traversed to get all the
        // plugin constructors to be instantiated in the correct order and to validate against some rules. Finally, if
        // no plugin is missing and no other error has been found, they all will be instantiated.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        const context = this._context;
        findAvailablePluginConstructors(plugins);
        validatePlugins(plugins);
        const pluginsToLoad = plugins.filter((plugin)=>!isPluginRemoved(plugin, pluginsToRemove));
        const pluginConstructors = [
            ...getPluginConstructors(pluginsToLoad)
        ];
        substitutePlugins(pluginConstructors, pluginsSubstitutions);
        const pluginInstances = loadPlugins(pluginConstructors);
        return initPlugins(pluginInstances, 'init').then(()=>initPlugins(pluginInstances, 'afterInit')).then(()=>pluginInstances);
        function isPluginConstructor(plugin) {
            return typeof plugin === 'function';
        }
        function isContextPlugin(plugin) {
            return isPluginConstructor(plugin) && !!plugin.isContextPlugin;
        }
        function isPluginRemoved(plugin, pluginsToRemove) {
            return pluginsToRemove.some((removedPlugin)=>{
                if (removedPlugin === plugin) {
                    return true;
                }
                if (getPluginName(plugin) === removedPlugin) {
                    return true;
                }
                if (getPluginName(removedPlugin) === plugin) {
                    return true;
                }
                return false;
            });
        }
        function getPluginName(plugin) {
            return isPluginConstructor(plugin) ? plugin.pluginName || plugin.name : plugin;
        }
        function findAvailablePluginConstructors(plugins, processed = new Set()) {
            plugins.forEach((plugin)=>{
                if (!isPluginConstructor(plugin)) {
                    return;
                }
                if (processed.has(plugin)) {
                    return;
                }
                processed.add(plugin);
                if (plugin.pluginName && !that._availablePlugins.has(plugin.pluginName)) {
                    that._availablePlugins.set(plugin.pluginName, plugin);
                }
                if (plugin.requires) {
                    findAvailablePluginConstructors(plugin.requires, processed);
                }
            });
        }
        function getPluginConstructors(plugins, processed = new Set()) {
            return plugins.map((plugin)=>{
                return isPluginConstructor(plugin) ? plugin : that._availablePlugins.get(plugin);
            }).reduce((result, plugin)=>{
                if (processed.has(plugin)) {
                    return result;
                }
                processed.add(plugin);
                if (plugin.requires) {
                    validatePlugins(plugin.requires, plugin);
                    getPluginConstructors(plugin.requires, processed).forEach((plugin)=>result.add(plugin));
                }
                return result.add(plugin);
            }, new Set());
        }
        function validatePlugins(plugins, parentPluginConstructor = null) {
            plugins.map((plugin)=>{
                return isPluginConstructor(plugin) ? plugin : that._availablePlugins.get(plugin) || plugin;
            }).forEach((plugin)=>{
                checkMissingPlugin(plugin, parentPluginConstructor);
                checkContextPlugin(plugin, parentPluginConstructor);
                checkRemovedPlugin(plugin, parentPluginConstructor);
            });
        }
        function checkMissingPlugin(plugin, parentPluginConstructor) {
            if (isPluginConstructor(plugin)) {
                return;
            }
            if (parentPluginConstructor) {
                /**
				 * A required "soft" dependency was not found on the plugin list.
				 *
				 * When configuring the editor, either prior to building (via
				 * {@link module:core/editor/editor~Editor.builtinPlugins `Editor.builtinPlugins`}) or when
				 * creating a new instance of the editor (e.g. via
				 * {@link module:core/editor/editorconfig~EditorConfig#plugins `config.plugins`}), you need to provide
				 * some of the dependencies for other plugins that you used.
				 *
				 * This error is thrown when one of these dependencies was not provided. The name of the missing plugin
				 * can be found in `missingPlugin` and the plugin that required it in `requiredBy`.
				 *
				 * In order to resolve it, you need to import the missing plugin and add it to the
				 * current list of plugins (`Editor.builtinPlugins` or `config.plugins`/`config.extraPlugins`).
				 *
				 * Soft requirements were introduced in version 26.0.0. If you happen to stumble upon this error
				 * when upgrading to version 26.0.0, read also the
				 * {@glink updating/guides/update-to-26 Migration to 26.0.0} guide.
				 *
				 * @error plugincollection-soft-required
				 * @param missingPlugin The name of the required plugin.
				 * @param requiredBy The name of the plugin that requires the other plugin.
				 */ throw new CKEditorError('plugincollection-soft-required', context, {
                    missingPlugin: plugin,
                    requiredBy: getPluginName(parentPluginConstructor)
                });
            }
            /**
			 * A plugin is not available and could not be loaded.
			 *
			 * Plugin classes (constructors) need to be provided to the editor before they can be loaded by name.
			 * This is usually done in CKEditor 5 builds by setting the {@link module:core/editor/editor~Editor.builtinPlugins}
			 * property.
			 *
			 * **If you see this warning when using one of the CKEditor 5 Builds},
			 * it means that you try to enable a plugin which was not included in that build. This may be due to a typo
			 * in the plugin name or simply because that plugin is not a part of this build.
			 *
			 * Predefined builds are a deprecated solution and we strongly advise
			 * {@glink updating/nim-migration/migration-to-new-installation-methods migrating to new installation methods}.
			 *
			 * **If you see this warning when using one of the editor creators directly** (not a build), then it means
			 * that you tried loading plugins by name. However, unlike CKEditor 4, CKEditor 5 does not implement a "plugin loader".
			 * This means that CKEditor 5 does not know where to load the plugin modules from. Therefore, you need to
			 * provide each plugin through a reference (as a constructor function). Check out the examples in the
			 * {@glink getting-started/installation/quick-start Quick start} guide.
			 *
			 * @error plugincollection-plugin-not-found
			 * @param plugin The name of the plugin which could not be loaded.
			 */ throw new CKEditorError('plugincollection-plugin-not-found', context, {
                plugin
            });
        }
        function checkContextPlugin(plugin, parentPluginConstructor) {
            if (!isContextPlugin(parentPluginConstructor)) {
                return;
            }
            if (isContextPlugin(plugin)) {
                return;
            }
            /**
			 * If a plugin is a context plugin, all plugins it requires should also be context plugins
			 * instead of plugins. In other words, if one plugin can be used in the context,
			 * all its requirements should also be ready to be used in the context. Note that the context
			 * provides only a part of the API provided by the editor. If one plugin needs a full
			 * editor API, all plugins which require it are considered as plugins that need a full
			 * editor API.
			 *
			 * @error plugincollection-context-required
			 * @param plugin The name of the required plugin.
			 * @param requiredBy The name of the parent plugin.
			 */ throw new CKEditorError('plugincollection-context-required', context, {
                plugin: getPluginName(plugin),
                requiredBy: getPluginName(parentPluginConstructor)
            });
        }
        function checkRemovedPlugin(plugin, parentPluginConstructor) {
            if (!parentPluginConstructor) {
                return;
            }
            if (!isPluginRemoved(plugin, pluginsToRemove)) {
                return;
            }
            /**
			 * Cannot load a plugin because one of its dependencies is listed in the `removePlugins` option.
			 *
			 * @error plugincollection-required
			 * @param plugin The name of the required plugin.
			 * @param requiredBy The name of the parent plugin.
			 */ throw new CKEditorError('plugincollection-required', context, {
                plugin: getPluginName(plugin),
                requiredBy: getPluginName(parentPluginConstructor)
            });
        }
        function loadPlugins(pluginConstructors) {
            return pluginConstructors.map((PluginConstructor)=>{
                let pluginInstance = that._contextPlugins.get(PluginConstructor);
                pluginInstance = pluginInstance || new PluginConstructor(context);
                that._add(PluginConstructor, pluginInstance);
                return pluginInstance;
            });
        }
        function initPlugins(pluginInstances, method) {
            return pluginInstances.reduce((promise, plugin)=>{
                if (!plugin[method]) {
                    return promise;
                }
                if (that._contextPlugins.has(plugin)) {
                    return promise;
                }
                return promise.then(plugin[method].bind(plugin));
            }, Promise.resolve());
        }
        /**
		 * Replaces plugin constructors with the specified set of plugins.
		 */ function substitutePlugins(pluginConstructors, pluginsSubstitutions) {
            for (const pluginItem of pluginsSubstitutions){
                if (typeof pluginItem != 'function') {
                    /**
					 * The plugin replacing an existing plugin must be a function.
					 *
					 * @error plugincollection-replace-plugin-invalid-type
					 */ throw new CKEditorError('plugincollection-replace-plugin-invalid-type', null, {
                        pluginItem
                    });
                }
                const pluginName = pluginItem.pluginName;
                if (!pluginName) {
                    /**
					 * The plugin replacing an existing plugin must have a name.
					 *
					 * @error plugincollection-replace-plugin-missing-name
					 */ throw new CKEditorError('plugincollection-replace-plugin-missing-name', null, {
                        pluginItem
                    });
                }
                if (pluginItem.requires && pluginItem.requires.length) {
                    /**
					 * The plugin replacing an existing plugin cannot depend on other plugins.
					 *
					 * @error plugincollection-plugin-for-replacing-cannot-have-dependencies
					 */ throw new CKEditorError('plugincollection-plugin-for-replacing-cannot-have-dependencies', null, {
                        pluginName
                    });
                }
                const pluginToReplace = that._availablePlugins.get(pluginName);
                if (!pluginToReplace) {
                    /**
					 * The replaced plugin does not exist in the
					 * {@link module:core/plugincollection~PluginCollection available plugins} collection.
					 *
					 * @error plugincollection-plugin-for-replacing-not-exist
					 */ throw new CKEditorError('plugincollection-plugin-for-replacing-not-exist', null, {
                        pluginName
                    });
                }
                const indexInPluginConstructors = pluginConstructors.indexOf(pluginToReplace);
                if (indexInPluginConstructors === -1) {
                    // The Context feature can substitute plugins as well.
                    // It may happen that the editor will be created with the given context, where the plugin for substitute
                    // was already replaced. In such a case, we don't want to do it again.
                    if (that._contextPlugins.has(pluginToReplace)) {
                        return;
                    }
                    /**
					 * The replaced plugin will not be loaded so it cannot be replaced.
					 *
					 * @error plugincollection-plugin-for-replacing-not-loaded
					 */ throw new CKEditorError('plugincollection-plugin-for-replacing-not-loaded', null, {
                        pluginName
                    });
                }
                if (pluginToReplace.requires && pluginToReplace.requires.length) {
                    /**
					 * The replaced plugin cannot depend on other plugins.
					 *
					 * @error plugincollection-replaced-plugin-cannot-have-dependencies
					 */ throw new CKEditorError('plugincollection-replaced-plugin-cannot-have-dependencies', null, {
                        pluginName
                    });
                }
                pluginConstructors.splice(indexInPluginConstructors, 1, pluginItem);
                that._availablePlugins.set(pluginName, pluginItem);
            }
        }
    }
    /**
	 * Destroys all loaded plugins.
	 */ destroy() {
        const promises = [];
        for (const [, pluginInstance] of this){
            if (typeof pluginInstance.destroy == 'function' && !this._contextPlugins.has(pluginInstance)) {
                promises.push(pluginInstance.destroy());
            }
        }
        return Promise.all(promises);
    }
    /**
	 * Adds the plugin to the collection. Exposed mainly for testing purposes.
	 *
	 * @param PluginConstructor The plugin constructor.
	 * @param plugin The instance of the plugin.
	 */ _add(PluginConstructor, plugin) {
        this._plugins.set(PluginConstructor, plugin);
        const pluginName = PluginConstructor.pluginName;
        if (!pluginName) {
            return;
        }
        if (this._plugins.has(pluginName)) {
            /**
			 * Two plugins with the same {@link module:core/plugin~PluginStaticMembers#pluginName} were loaded.
			 * This will lead to runtime conflicts between these plugins.
			 *
			 * In practice, this warning usually means that new plugins were added to an existing CKEditor 5 build.
			 * Plugins should always be added to a source version of the editor (`@ckeditor/ckeditor5-editor-*`),
			 * not to an editor imported from one of the `@ckeditor/ckeditor5-build-*` packages.
			 *
			 * Check your import paths and the list of plugins passed to
			 * {@link module:core/editor/editor~Editor.create `Editor.create()`}
			 * or specified in {@link module:core/editor/editor~Editor.builtinPlugins `Editor.builtinPlugins`}.
			 *
			 * Predefined builds are a deprecated solution and we strongly advise
			 * {@glink updating/nim-migration/migration-to-new-installation-methods migrating to new installation methods}.
			 *
			 * The second option is that your `node_modules/` directory contains duplicated versions of the same
			 * CKEditor 5 packages. Normally, on clean installations, npm deduplicates packages in `node_modules/`, so
			 * it may be enough to call `rm -rf node_modules && npm i`. However, if you installed conflicting versions
			 * of some packages, their dependencies may need to be installed in more than one version which may lead to this
			 * warning.
			 *
			 * Technically speaking, this error occurs because after adding a plugin to an existing editor build
			 * the dependencies of this plugin are being duplicated.
			 * They are already built into that editor build and now get added for the second time as dependencies
			 * of the plugin you are installing.
			 *
			 * @error plugincollection-plugin-name-conflict
			 * @param pluginName The duplicated plugin name.
			 * @param plugin1 The first plugin constructor.
			 * @param plugin2 The second plugin constructor.
			 */ throw new CKEditorError('plugincollection-plugin-name-conflict', null, {
                pluginName,
                plugin1: this._plugins.get(pluginName).constructor,
                plugin2: PluginConstructor
            });
        }
        this._plugins.set(pluginName, plugin);
    }
}

/**
 * Provides a common, higher-level environment for solutions that use multiple {@link module:core/editor/editor~Editor editors}
 * or plugins that work outside the editor. Use it instead of {@link module:core/editor/editor~Editor.create `Editor.create()`}
 * in advanced application integrations.
 *
 * All configuration options passed to a context will be used as default options for the editor instances initialized in that context.
 *
 * {@link module:core/contextplugin~ContextPlugin Context plugins} passed to a context instance will be shared among all
 * editor instances initialized in this context. These will be the same plugin instances for all the editors.
 *
 * **Note:** The context can only be initialized with {@link module:core/contextplugin~ContextPlugin context plugins}
 * (e.g. [comments](https://ckeditor.com/collaboration/comments/)). Regular {@link module:core/plugin~Plugin plugins} require an
 * editor instance to work and cannot be added to a context.
 *
 * **Note:** You can add a context plugin to an editor instance, though.
 *
 * If you are using multiple editor instances on one page and use any context plugins, create a context to share the configuration and
 * plugins among these editors. Some plugins will use the information about all existing editors to better integrate between them.
 *
 * If you are using plugins that do not require an editor to work (e.g. [comments](https://ckeditor.com/collaboration/comments/)),
 * enable and configure them using the context.
 *
 * If you are using only a single editor on each page, use {@link module:core/editor/editor~Editor.create `Editor.create()`} instead.
 * In such a case, a context instance will be created by the editor instance in a transparent way.
 *
 * See {@link ~Context.create `Context.create()`} for usage examples.
 */ class Context {
    /**
	 * Stores all the configurations specific to this context instance.
	 */ config;
    /**
	 * The plugins loaded and in use by this context instance.
	 */ plugins;
    locale;
    /**
	 * Shorthand for {@link module:utils/locale~Locale#t}.
	 */ t;
    /**
	 * A list of editors that this context instance is injected to.
	 */ editors;
    /**
	 * The default configuration which is built into the `Context` class.
	 *
	 * It is used in CKEditor 5 builds featuring `Context` to provide the default configuration options which are later used during the
	 * context initialization.
	 *
	 * ```ts
	 * Context.defaultConfig = {
	 * 	foo: 1,
	 * 	bar: 2
	 * };
	 *
	 * Context
	 * 	.create()
	 * 	.then( context => {
	 * 		context.config.get( 'foo' ); // -> 1
	 * 		context.config.get( 'bar' ); // -> 2
	 * 	} );
	 *
	 * // The default options can be overridden by the configuration passed to create().
	 * Context
	 * 	.create( { bar: 3 } )
	 * 	.then( context => {
	 * 		context.config.get( 'foo' ); // -> 1
	 * 		context.config.get( 'bar' ); // -> 3
	 * 	} );
	 * ```
	 *
	 * See also {@link module:core/context~Context.builtinPlugins `Context.builtinPlugins`}
	 * and {@link module:core/editor/editor~Editor.defaultConfig `Editor.defaultConfig`}.
	 */ static defaultConfig;
    /**
	 * An array of plugins built into the `Context` class.
	 *
	 * It is used in CKEditor 5 builds featuring `Context` to provide a list of context plugins which are later automatically initialized
	 * during the context initialization.
	 *
	 * They will be automatically initialized by `Context` unless `config.plugins` is passed.
	 *
	 * ```ts
	 * // Build some context plugins into the Context class first.
	 * Context.builtinPlugins = [ FooPlugin, BarPlugin ];
	 *
	 * // Normally, you need to define config.plugins, but since Context.builtinPlugins was
	 * // defined, now you can call create() without any configuration.
	 * Context
	 * 	.create()
	 * 	.then( context => {
	 * 		context.plugins.get( FooPlugin ); // -> An instance of the Foo plugin.
	 * 		context.plugins.get( BarPlugin ); // -> An instance of the Bar plugin.
	 * 	} );
	 * ```
	 *
	 * See also {@link module:core/context~Context.defaultConfig `Context.defaultConfig`}
	 * and {@link module:core/editor/editor~Editor.builtinPlugins `Editor.builtinPlugins`}.
	 */ static builtinPlugins;
    /**
	 * Reference to the editor which created the context.
	 * Null when the context was created outside of the editor.
	 *
	 * It is used to destroy the context when removing the editor that has created the context.
	 */ _contextOwner = null;
    /**
	 * Creates a context instance with a given configuration.
	 *
	 * Usually not to be used directly. See the static {@link module:core/context~Context.create `create()`} method.
	 *
	 * @param config The context configuration.
	 */ constructor(config){
        // We don't pass translations to the config, because its behavior of splitting keys
        // with dots (e.g. `resize.width` => `resize: { width }`) breaks the translations.
        const { translations, ...rest } = config || {};
        this.config = new Config(rest, this.constructor.defaultConfig);
        const availablePlugins = this.constructor.builtinPlugins;
        this.config.define('plugins', availablePlugins);
        this.plugins = new PluginCollection(this, availablePlugins);
        const languageConfig = this.config.get('language') || {};
        this.locale = new Locale({
            uiLanguage: typeof languageConfig === 'string' ? languageConfig : languageConfig.ui,
            contentLanguage: this.config.get('language.content'),
            translations
        });
        this.t = this.locale.t;
        this.editors = new Collection();
    }
    /**
	 * Loads and initializes plugins specified in the configuration.
	 *
	 * @returns A promise which resolves once the initialization is completed, providing an array of loaded plugins.
	 */ initPlugins() {
        const plugins = this.config.get('plugins') || [];
        const substitutePlugins = this.config.get('substitutePlugins') || [];
        // Plugins for substitution should be checked as well.
        for (const Plugin of plugins.concat(substitutePlugins)){
            if (typeof Plugin != 'function') {
                /**
				 * Only a constructor function is allowed as a {@link module:core/contextplugin~ContextPlugin context plugin}.
				 *
				 * @error context-initplugins-constructor-only
				 */ throw new CKEditorError('context-initplugins-constructor-only', null, {
                    Plugin
                });
            }
            if (Plugin.isContextPlugin !== true) {
                /**
				 * Only a plugin marked as a {@link module:core/contextplugin~ContextPlugin.isContextPlugin context plugin}
				 * is allowed to be used with a context.
				 *
				 * @error context-initplugins-invalid-plugin
				 */ throw new CKEditorError('context-initplugins-invalid-plugin', null, {
                    Plugin
                });
            }
        }
        return this.plugins.init(plugins, [], substitutePlugins);
    }
    /**
	 * Destroys the context instance and all editors used with the context,
	 * releasing all resources used by the context.
	 *
	 * @returns A promise that resolves once the context instance is fully destroyed.
	 */ destroy() {
        return Promise.all(Array.from(this.editors, (editor)=>editor.destroy())).then(()=>this.plugins.destroy());
    }
    /**
	 * Adds a reference to the editor which is used with this context.
	 *
	 * When the given editor has created the context, the reference to this editor will be stored
	 * as a {@link ~Context#_contextOwner}.
	 *
	 * This method should only be used by the editor.
	 *
	 * @internal
	 * @param isContextOwner Stores the given editor as a context owner.
	 */ _addEditor(editor, isContextOwner) {
        if (this._contextOwner) {
            /**
			 * Cannot add multiple editors to the context which is created by the editor.
			 *
			 * @error context-addeditor-private-context
			 */ throw new CKEditorError('context-addeditor-private-context');
        }
        this.editors.add(editor);
        if (isContextOwner) {
            this._contextOwner = editor;
        }
    }
    /**
	 * Removes a reference to the editor which was used with this context.
	 * When the context was created by the given editor, the context will be destroyed.
	 *
	 * This method should only be used by the editor.
	 *
	 * @internal
	 * @return A promise that resolves once the editor is removed from the context or when the context was destroyed.
	 */ _removeEditor(editor) {
        if (this.editors.has(editor)) {
            this.editors.remove(editor);
        }
        if (this._contextOwner === editor) {
            return this.destroy();
        }
        return Promise.resolve();
    }
    /**
	 * Returns the context configuration which will be copied to the editors created using this context.
	 *
	 * The configuration returned by this method has the plugins configuration removed &ndash; plugins are shared with all editors
	 * through another mechanism.
	 *
	 * This method should only be used by the editor.
	 *
	 * @internal
	 * @returns Configuration as a plain object.
	 */ _getEditorConfig() {
        const result = {};
        for (const name of this.config.names()){
            if (![
                'plugins',
                'removePlugins',
                'extraPlugins'
            ].includes(name)) {
                result[name] = this.config.get(name);
            }
        }
        return result;
    }
    /**
	 * Creates and initializes a new context instance.
	 *
	 * ```ts
	 * const commonConfig = { ... }; // Configuration for all the plugins and editors.
	 * const editorPlugins = [ ... ]; // Regular plugins here.
	 *
	 * Context
	 * 	.create( {
	 * 		// Only context plugins here.
	 * 		plugins: [ ... ],
	 *
	 * 		// Configure the language for all the editors (it cannot be overwritten).
	 * 		language: { ... },
	 *
	 * 		// Configuration for context plugins.
	 * 		comments: { ... },
	 * 		...
	 *
	 * 		// Default configuration for editor plugins.
	 * 		toolbar: { ... },
	 * 		image: { ... },
	 * 		...
	 * 	} )
	 * 	.then( context => {
	 * 		const promises = [];
	 *
	 * 		promises.push( ClassicEditor.create(
	 * 			document.getElementById( 'editor1' ),
	 * 			{
	 * 				editorPlugins,
	 * 				context
	 * 			}
	 * 		) );
	 *
	 * 		promises.push( ClassicEditor.create(
	 * 			document.getElementById( 'editor2' ),
	 * 			{
	 * 				editorPlugins,
	 * 				context,
	 * 				toolbar: { ... } // You can overwrite the configuration of the context.
	 * 			}
	 * 		) );
	 *
	 * 		return Promise.all( promises );
	 * 	} );
	 * ```
	 *
	 * @param config The context configuration.
	 * @returns A promise resolved once the context is ready. The promise resolves with the created context instance.
	 */ static create(config) {
        return new Promise((resolve)=>{
            const context = new this(config);
            resolve(context.initPlugins().then(()=>context));
        });
    }
}

/**
 * The base class for {@link module:core/context~Context} plugin classes.
 *
 * A context plugin can either be initialized for an {@link module:core/editor/editor~Editor editor} or for
 * a {@link module:core/context~Context context}. In other words, it can either
 * work within one editor instance or with one or more editor instances that use a single context.
 * It is the context plugin's role to implement handling for both modes.
 *
 * There are a few rules for interaction between the editor plugins and context plugins:
 *
 * * A context plugin can require another context plugin.
 * * An {@link module:core/plugin~Plugin editor plugin} can require a context plugin.
 * * A context plugin MUST NOT require an {@link module:core/plugin~Plugin editor plugin}.
 */ class ContextPlugin extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * The context or editor instance.
	 */ context;
    /**
	 * Creates a new plugin instance.
	 */ constructor(context){
        super();
        this.context = context;
    }
    /**
	 * @inheritDoc
	 */ destroy() {
        this.stopListening();
    }
    /**
	 * @inheritDoc
	 */ static get isContextPlugin() {
        return true;
    }
}

/**
 * Collection of commands. Its instance is available in {@link module:core/editor/editor~Editor#commands `editor.commands`}.
 */ class CommandCollection {
    /**
	 * Command map.
	 */ _commands;
    /**
	 * Creates collection instance.
	 */ constructor(){
        this._commands = new Map();
    }
    /**
	 * Registers a new command.
	 *
	 * @param commandName The name of the command.
	 */ add(commandName, command) {
        this._commands.set(commandName, command);
    }
    /**
	 * Retrieves a command from the collection.
	 *
	 * @param commandName The name of the command.
	 */ get(commandName) {
        return this._commands.get(commandName);
    }
    /**
	 * Executes a command.
	 *
	 * @param commandName The name of the command.
	 * @param commandParams Command parameters.
	 * @returns The value returned by the {@link module:core/command~Command#execute `command.execute()`}.
	 */ execute(commandName, ...commandParams) {
        const command = this.get(commandName);
        if (!command) {
            /**
			 * Command does not exist.
			 *
			 * @error commandcollection-command-not-found
			 * @param commandName Name of the command.
			 */ throw new CKEditorError('commandcollection-command-not-found', this, {
                commandName
            });
        }
        return command.execute(...commandParams);
    }
    /**
	 * Returns iterator of command names.
	 */ *names() {
        yield* this._commands.keys();
    }
    /**
	 * Returns iterator of command instances.
	 */ *commands() {
        yield* this._commands.values();
    }
    /**
	 * Iterable interface.
	 *
	 * Returns `[ commandName, commandInstance ]` pairs.
	 */ [Symbol.iterator]() {
        return this._commands[Symbol.iterator]();
    }
    /**
	 * Destroys all collection commands.
	 */ destroy() {
        for (const command of this.commands()){
            command.destroy();
        }
    }
}

/**
 * A keystroke handler for editor editing. Its instance is available
 * in {@link module:core/editor/editor~Editor#keystrokes} so plugins
 * can register their keystrokes.
 *
 * E.g. an undo plugin would do this:
 *
 * ```ts
 * editor.keystrokes.set( 'Ctrl+Z', 'undo' );
 * editor.keystrokes.set( 'Ctrl+Shift+Z', 'redo' );
 * editor.keystrokes.set( 'Ctrl+Y', 'redo' );
 * ```
 */ class EditingKeystrokeHandler extends KeystrokeHandler {
    /**
	 * The editor instance.
	 */ editor;
    /**
	 * Creates an instance of the keystroke handler.
	 */ constructor(editor){
        super();
        this.editor = editor;
    }
    /**
	 * Registers a handler for the specified keystroke.
	 *
	 * The handler can be specified as a command name or a callback.
	 *
	 * @param keystroke Keystroke defined in a format accepted by
	 * the {@link module:utils/keyboard~parseKeystroke} function.
	 * @param callback If a string is passed, then the keystroke will
	 * {@link module:core/editor/editor~Editor#execute execute a command}.
	 * If a function, then it will be called with the
	 * {@link module:engine/view/observer/keyobserver~KeyEventData key event data} object and
	 * a `cancel()` helper to both `preventDefault()` and `stopPropagation()` of the event.
	 * @param options Additional options.
	 * @param options.priority The priority of the keystroke callback. The higher the priority value
	 * the sooner the callback will be executed. Keystrokes having the same priority
	 * are called in the order they were added.
	 */ set(keystroke, callback, options = {}) {
        if (typeof callback == 'string') {
            const commandName = callback;
            callback = (evtData, cancel)=>{
                this.editor.execute(commandName);
                cancel();
            };
        }
        super.set(keystroke, callback, options);
    }
}

const DEFAULT_CATEGORY_ID = 'contentEditing';
const DEFAULT_GROUP_ID = 'common';
/**
 * A common namespace for various accessibility features of the editor.
 *
 * **Information about editor keystrokes**
 *
 * * The information about keystrokes available in the editor is stored in the {@link #keystrokeInfos} property.
 * * New info entries can be added using the {@link #addKeystrokeInfoCategory}, {@link #addKeystrokeInfoGroup},
 * and {@link #addKeystrokeInfos} methods.
 */ class Accessibility {
    /**
	 * Stores information about keystrokes brought by editor features for the users to interact with the editor, mainly
	 * keystroke combinations and their accessible labels.
	 *
	 * This information is particularly useful for screen reader and other assistive technology users. It gets displayed
	 * by the {@link module:ui/editorui/accessibilityhelp/accessibilityhelp~AccessibilityHelp Accessibility help} dialog.
	 *
	 * Keystrokes are organized in categories and groups. They can be added using ({@link #addKeystrokeInfoCategory},
	 * {@link #addKeystrokeInfoGroup}, and {@link #addKeystrokeInfos}) methods.
	 *
	 * Please note that:
	 * * two categories are always available:
	 *   * `'contentEditing'` for keystrokes related to content creation,
	 *   * `'navigation'` for keystrokes related to navigation in the UI and the content.
	 * * unless specified otherwise, new keystrokes are added into the `'contentEditing'` category and the `'common'`
	 * keystroke group within that category while using the {@link #addKeystrokeInfos} method.
	 */ keystrokeInfos = new Map();
    /**
	 * The editor instance.
	 */ _editor;
    /**
	 * @inheritDoc
	 */ constructor(editor){
        this._editor = editor;
        const isMenuBarVisible = editor.config.get('menuBar.isVisible');
        const t = editor.locale.t;
        this.addKeystrokeInfoCategory({
            id: DEFAULT_CATEGORY_ID,
            label: t('Content editing keystrokes'),
            description: t('These keyboard shortcuts allow for quick access to content editing features.')
        });
        const navigationKeystrokes = [
            {
                label: t('Close contextual balloons, dropdowns, and dialogs'),
                keystroke: 'Esc'
            },
            {
                label: t('Open the accessibility help dialog'),
                keystroke: 'Alt+0'
            },
            {
                label: t('Move focus between form fields (inputs, buttons, etc.)'),
                keystroke: [
                    [
                        'Tab'
                    ],
                    [
                        'Shift+Tab'
                    ]
                ]
            },
            {
                label: t('Move focus to the toolbar, navigate between toolbars'),
                keystroke: 'Alt+F10',
                mayRequireFn: true
            },
            {
                label: t('Navigate through the toolbar or menu bar'),
                keystroke: [
                    [
                        'arrowup'
                    ],
                    [
                        'arrowright'
                    ],
                    [
                        'arrowdown'
                    ],
                    [
                        'arrowleft'
                    ]
                ]
            },
            {
                // eslint-disable-next-line max-len
                label: t('Execute the currently focused button. Executing buttons that interact with the editor content moves the focus back to the content.'),
                keystroke: [
                    [
                        'Enter'
                    ],
                    [
                        'Space'
                    ]
                ]
            }
        ];
        if (isMenuBarVisible) {
            navigationKeystrokes.push({
                label: t('Move focus to the menu bar, navigate between menu bars'),
                keystroke: 'Alt+F9',
                mayRequireFn: true
            });
        }
        this.addKeystrokeInfoCategory({
            id: 'navigation',
            label: t('User interface and content navigation keystrokes'),
            description: t('Use the following keystrokes for more efficient navigation in the CKEditor 5 user interface.'),
            groups: [
                {
                    id: 'common',
                    keystrokes: navigationKeystrokes
                }
            ]
        });
    }
    /**
	 * Adds a top-level category in the {@link #keystrokeInfos keystroke information database} with a label and optional description.
	 *
	 * Categories organize keystrokes and help users to find the right keystroke. Each category can have multiple groups
	 * of keystrokes that narrow down the context in which the keystrokes are available. Every keystroke category comes
	 * with a `'common'` group by default.
	 *
	 * By default, two categories are available:
	 * * `'contentEditing'` for keystrokes related to content creation,
	 * * `'navigation'` for keystrokes related to navigation in the UI and the content.
	 *
	 * To create a new keystroke category with new groups, use the following code:
	 *
	 * ```js
	 * class MyPlugin extends Plugin {
	 * 	// ...
	 * 	init() {
	 * 		const editor = this.editor;
	 * 		const t = editor.t;
	 *
	 * 		// ...
	 *
	 * 		editor.accessibility.addKeystrokeInfoCategory( {
	 * 			id: 'myCategory',
	 * 			label: t( 'My category' ),
	 * 			description: t( 'My category description.' ),
	 * 			groups: [
	 * 				{
	 * 					id: 'myGroup',
	 * 					label: t( 'My keystroke group' ),
	 * 					keystrokes: [
	 * 						{
	 * 							label: t( 'Keystroke label 1' ),
	 * 							keystroke: 'Ctrl+Shift+N'
	 * 						},
	 * 						{
	 * 							label: t( 'Keystroke label 2' ),
	 * 							keystroke: 'Ctrl+Shift+M'
	 * 						}
	 * 					]
	 * 				}
	 * 			]
	 * 		};
	 * 	}
	 * }
	 * ```
	 *
	 * See {@link #keystrokeInfos}, {@link #addKeystrokeInfoGroup}, and {@link #addKeystrokeInfos}.
	 */ addKeystrokeInfoCategory({ id, label, description, groups }) {
        this.keystrokeInfos.set(id, {
            id,
            label,
            description,
            groups: new Map()
        });
        this.addKeystrokeInfoGroup({
            categoryId: id,
            id: DEFAULT_GROUP_ID
        });
        if (groups) {
            groups.forEach((group)=>{
                this.addKeystrokeInfoGroup({
                    categoryId: id,
                    ...group
                });
            });
        }
    }
    /**
	 * Adds a group of keystrokes in a specific category to the {@link #keystrokeInfos keystroke information database}.
	 *
	 * Groups narrow down the context in which the keystrokes are available. When `categoryId` is not specified,
	 * the group goes to the `'contentEditing'` category (default).
	 *
	 * To create a new group within an existing category, use the following code:
	 *
	 * ```js
	 * class MyPlugin extends Plugin {
	 * 	// ...
	 * 	init() {
	 * 		const editor = this.editor;
	 * 		const t = editor.t;
	 *
	 * 		// ...
	 *
	 * 		editor.accessibility.addKeystrokeInfoGroup( {
	 * 			id: 'myGroup',
	 * 			categoryId: 'navigation',
	 * 			label: t( 'My keystroke group' ),
	 * 			keystrokes: [
	 * 				{
	 * 					label: t( 'Keystroke label 1' ),
	 * 					keystroke: 'Ctrl+Shift+N'
	 * 				},
	 * 				{
	 * 					label: t( 'Keystroke label 2' ),
	 * 					keystroke: 'Ctrl+Shift+M'
	 * 				}
	 * 			]
	 * 		} );
	 * 	}
	 * }
	 * ```
	 *
	 * See {@link #keystrokeInfos}, {@link #addKeystrokeInfoCategory}, and {@link #addKeystrokeInfos}.
	 */ addKeystrokeInfoGroup({ categoryId = DEFAULT_CATEGORY_ID, id, label, keystrokes }) {
        const category = this.keystrokeInfos.get(categoryId);
        if (!category) {
            throw new CKEditorError('accessibility-unknown-keystroke-info-category', this._editor, {
                groupId: id,
                categoryId
            });
        }
        category.groups.set(id, {
            id,
            label,
            keystrokes: keystrokes || []
        });
    }
    /**
	 * Adds information about keystrokes to the {@link #keystrokeInfos keystroke information database}.
	 *
	 * Keystrokes without specified `groupId` or `categoryId` go to the `'common'` group in the `'contentEditing'` category (default).
	 *
	 * To add a keystroke brought by your plugin (using default group and category), use the following code:
	 *
	 * ```js
	 * class MyPlugin extends Plugin {
	 * 	// ...
	 * 	init() {
	 * 		const editor = this.editor;
	 * 		const t = editor.t;
	 *
	 * 		// ...
	 *
	 * 		editor.accessibility.addKeystrokeInfos( {
	 * 			keystrokes: [
	 * 				{
	 * 					label: t( 'Keystroke label' ),
	 * 					keystroke: 'CTRL+B'
	 * 				}
	 * 			]
	 * 		} );
	 * 	}
	 * }
	 * ```
	 * To add a keystroke in a specific existing `'widget'` group in the default `'contentEditing'` category:
	 *
	 * ```js
	 * class MyPlugin extends Plugin {
	 * 	// ...
	 * 	init() {
	 * 		const editor = this.editor;
	 * 		const t = editor.t;
	 *
	 * 		// ...
	 *
	 * 		editor.accessibility.addKeystrokeInfos( {
	 * 			// Add a keystroke to the existing "widget" group.
	 * 			groupId: 'widget',
	 * 			keystrokes: [
	 * 				{
	 * 					label: t( 'A an action on a selected widget' ),
	 * 					keystroke: 'Ctrl+D',
	 * 				}
	 * 			]
	 * 		} );
	 * 	}
	 * }
	 * ```
	 *
	 * To add a keystroke to another existing category (using default group):
	 *
	 * ```js
	 * class MyPlugin extends Plugin {
	 * 	// ...
	 * 	init() {
	 * 		const editor = this.editor;
	 * 		const t = editor.t;
	 *
	 * 		// ...
	 *
	 * 		editor.accessibility.addKeystrokeInfos( {
	 * 			// Add keystrokes to the "navigation" category (one of defaults).
	 * 			categoryId: 'navigation',
	 * 			keystrokes: [
	 * 				{
	 * 					label: t( 'Keystroke label' ),
	 * 					keystroke: 'CTRL+B'
	 * 				}
	 * 			]
	 * 		} );
	 * 	}
	 * }
	 * ```
	 *
	 * See {@link #keystrokeInfos}, {@link #addKeystrokeInfoGroup}, and {@link #addKeystrokeInfoCategory}.
	 */ addKeystrokeInfos({ categoryId = DEFAULT_CATEGORY_ID, groupId = DEFAULT_GROUP_ID, keystrokes }) {
        if (!this.keystrokeInfos.has(categoryId)) {
            /**
			 * Cannot add keystrokes in an unknown category. Use
			 * {@link module:core/accessibility~Accessibility#addKeystrokeInfoCategory}
			 * to add a new category or make sure the specified category exists.
			 *
			 * @error accessibility-unknown-keystroke-info-category
			 * @param categoryId The id of the unknown keystroke category.
			 * @param keystrokes Keystroke definitions about to be added.
			 */ throw new CKEditorError('accessibility-unknown-keystroke-info-category', this._editor, {
                categoryId,
                keystrokes
            });
        }
        const category = this.keystrokeInfos.get(categoryId);
        if (!category.groups.has(groupId)) {
            /**
			 * Cannot add keystrokes to an unknown group.
			 *
			 * Use {@link module:core/accessibility~Accessibility#addKeystrokeInfoGroup}
			 * to add a new group or make sure the specified group exists.
			 *
			 * @error accessibility-unknown-keystroke-info-group
			 * @param groupId The id of the unknown keystroke group.
			 * @param categoryId The id of category the unknown group should belong to.
			 * @param keystrokes Keystroke definitions about to be added.
			 */ throw new CKEditorError('accessibility-unknown-keystroke-info-group', this._editor, {
                groupId,
                categoryId,
                keystrokes
            });
        }
        category.groups.get(groupId).keystrokes.push(...keystrokes);
    }
}

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
 */ class Editor extends /* #__PURE__ */ ObservableMixin() {
    /**
	 * A namespace for the accessibility features of the editor.
	 */ accessibility;
    /**
	 * Commands registered to the editor.
	 *
	 * Use the shorthand {@link #execute `editor.execute()`} method to execute commands:
	 *
	 * ```ts
	 * // Execute the bold command:
	 * editor.execute( 'bold' );
	 *
	 * // Check the state of the bold command:
	 * editor.commands.get( 'bold' ).value;
	 * ```
	 */ commands;
    /**
	 * Stores all configurations specific to this editor instance.
	 *
	 * ```ts
	 * editor.config.get( 'image.toolbar' );
	 * // -> [ 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative' ]
	 * ```
	 */ config;
    /**
	 * Conversion manager through which you can register model-to-view and view-to-model converters.
	 *
	 * See the {@link module:engine/conversion/conversion~Conversion} documentation to learn how to add converters.
	 */ conversion;
    /**
	 * The {@link module:engine/controller/datacontroller~DataController data controller}.
	 * Used e.g. for setting and retrieving the editor data.
	 */ data;
    /**
	 * The {@link module:engine/controller/editingcontroller~EditingController editing controller}.
	 * Controls user input and rendering the content for editing.
	 */ editing;
    /**
	 * The locale instance.
	 */ locale;
    /**
	 * The editor's model.
	 *
	 * The central point of the editor's abstract data model.
	 */ model;
    /**
	 * The plugins loaded and in use by this editor instance.
	 *
	 * ```ts
	 * editor.plugins.get( 'ClipboardPipeline' ); // -> An instance of the clipboard pipeline plugin.
	 * ```
	 */ plugins;
    /**
	 * An instance of the {@link module:core/editingkeystrokehandler~EditingKeystrokeHandler}.
	 *
	 * It allows setting simple keystrokes:
	 *
	 * ```ts
	 * // Execute the bold command on Ctrl+E:
	 * editor.keystrokes.set( 'Ctrl+E', 'bold' );
	 *
	 * // Execute your own callback:
	 * editor.keystrokes.set( 'Ctrl+E', ( data, cancel ) => {
	 * 	console.log( data.keyCode );
	 *
	 * 	// Prevent the default (native) action and stop the underlying keydown event
	 * 	// so no other editor feature will interfere.
	 * 	cancel();
	 * } );
	 * ```
	 *
	 * Note: Certain typing-oriented keystrokes (like <kbd>Backspace</kbd> or <kbd>Enter</kbd>) are handled
	 * by a low-level mechanism and trying to listen to them via the keystroke handler will not work reliably.
	 * To handle these specific keystrokes, see the events fired by the
	 * {@link module:engine/view/document~Document editing view document} (`editor.editing.view.document`).
	 */ keystrokes;
    /**
	 * Shorthand for {@link module:utils/locale~Locale#t}.
	 *
	 * @see module:utils/locale~Locale#t
	 */ t;
    /**
	 * The default configuration which is built into the editor class.
	 *
	 * It is used in CKEditor 5 builds to provide the default configuration options which are later used during the editor initialization.
	 *
	 * ```ts
	 * ClassicEditor.defaultConfig = {
	 * 	foo: 1,
	 * 	bar: 2
	 * };
	 *
	 * ClassicEditor
	 * 	.create( sourceElement )
	 * 	.then( editor => {
	 * 		editor.config.get( 'foo' ); // -> 1
	 * 		editor.config.get( 'bar' ); // -> 2
	 * 	} );
	 *
	 * // The default options can be overridden by the configuration passed to create().
	 * ClassicEditor
	 * 	.create( sourceElement, { bar: 3 } )
	 * 	.then( editor => {
	 * 		editor.config.get( 'foo' ); // -> 1
	 * 		editor.config.get( 'bar' ); // -> 3
	 * 	} );
	 * ```
	 *
	 * See also {@link module:core/editor/editor~Editor.builtinPlugins}.
	 */ static defaultConfig;
    /**
	 * An array of plugins built into this editor class.
	 *
	 * It is used in CKEditor 5 builds to provide a list of plugins which are later automatically initialized
	 * during the editor initialization.
	 *
	 * They will be automatically initialized by the editor, unless listed in `config.removePlugins` and
	 * unless `config.plugins` is passed.
	 *
	 * ```ts
	 * // Build some plugins into the editor class first.
	 * ClassicEditor.builtinPlugins = [ FooPlugin, BarPlugin ];
	 *
	 * // Normally, you need to define config.plugins, but since ClassicEditor.builtinPlugins was
	 * // defined, now you can call create() without any configuration.
	 * ClassicEditor
	 * 	.create( sourceElement )
	 * 	.then( editor => {
	 * 		editor.plugins.get( FooPlugin ); // -> An instance of the Foo plugin.
	 * 		editor.plugins.get( BarPlugin ); // -> An instance of the Bar plugin.
	 * 	} );
	 *
	 * ClassicEditor
	 * 	.create( sourceElement, {
	 * 		// Do not initialize these plugins (note: it is defined by a string):
	 * 		removePlugins: [ 'Foo' ]
	 * 	} )
	 * 	.then( editor => {
	 * 		editor.plugins.get( FooPlugin ); // -> Undefined.
	 * 		editor.config.get( BarPlugin ); // -> An instance of the Bar plugin.
	 * 	} );
	 *
	 * ClassicEditor
	 * 	.create( sourceElement, {
	 * 		// Load only this plugin. It can also be defined by a string if
	 * 		// this plugin was built into the editor class.
	 * 		plugins: [ FooPlugin ]
	 * 	} )
	 * 	.then( editor => {
	 * 		editor.plugins.get( FooPlugin ); // -> An instance of the Foo plugin.
	 * 		editor.config.get( BarPlugin ); // -> Undefined.
	 * 	} );
	 * ```
	 *
	 * See also {@link module:core/editor/editor~Editor.defaultConfig}.
	 */ static builtinPlugins;
    /**
	 * The editor context.
	 * When it is not provided through the configuration, the editor creates it.
	 */ _context;
    /**
	 * A set of lock IDs for the {@link #isReadOnly} getter.
	 */ _readOnlyLocks;
    /**
	 * Creates a new instance of the editor class.
	 *
	 * Usually, not to be used directly. See the static {@link module:core/editor/editor~Editor.create `create()`} method.
	 *
	 * @param config The editor configuration.
	 */ constructor(config = {}){
        super();
        const constructor = this.constructor;
        // We don't pass translations to the config, because its behavior of splitting keys
        // with dots (e.g. `resize.width` => `resize: { width }`) breaks the translations.
        const { translations: defaultTranslations, ...defaultConfig } = constructor.defaultConfig || {};
        const { translations = defaultTranslations, ...rest } = config;
        // Prefer the language passed as the argument to the constructor instead of the constructor's `defaultConfig`, if both are set.
        const language = config.language || defaultConfig.language;
        this._context = config.context || new Context({
            language,
            translations
        });
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
        this.once('ready', ()=>this.state = 'ready', {
            priority: 'high'
        });
        this.once('destroy', ()=>this.state = 'destroyed', {
            priority: 'high'
        });
        this.model = new Model();
        this.on('change:isReadOnly', ()=>{
            this.model.document.isReadOnly = this.isReadOnly;
        });
        const stylesProcessor = new StylesProcessor();
        this.data = new DataController(this.model, stylesProcessor);
        this.editing = new EditingController(this.model, stylesProcessor);
        this.editing.view.document.bind('isReadOnly').to(this);
        this.conversion = new Conversion([
            this.editing.downcastDispatcher,
            this.data.downcastDispatcher
        ], this.data.upcastDispatcher);
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
	 */ get isReadOnly() {
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
		 */ throw new CKEditorError('editor-isreadonly-has-no-setter');
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
	 */ enableReadOnlyMode(lockId) {
        if (typeof lockId !== 'string' && typeof lockId !== 'symbol') {
            /**
			 * The lock ID is missing or it is not a string or symbol.
			 *
			 * @error editor-read-only-lock-id-invalid
			 */ throw new CKEditorError('editor-read-only-lock-id-invalid', null, {
                lockId
            });
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
	 */ disableReadOnlyMode(lockId) {
        if (typeof lockId !== 'string' && typeof lockId !== 'symbol') {
            throw new CKEditorError('editor-read-only-lock-id-invalid', null, {
                lockId
            });
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
	 */ setData(data) {
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
	 */ getData(options) {
        return this.data.get(options);
    }
    /**
	 * Loads and initializes plugins specified in the configuration.
	 *
	 * @returns A promise which resolves once the initialization is completed, providing an array of loaded plugins.
	 */ initPlugins() {
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
	 */ destroy() {
        let readyPromise = Promise.resolve();
        if (this.state == 'initializing') {
            readyPromise = new Promise((resolve)=>this.once('ready', resolve));
        }
        return readyPromise.then(()=>{
            this.fire('destroy');
            this.stopListening();
            this.commands.destroy();
        }).then(()=>this.plugins.destroy()).then(()=>{
            this.model.destroy();
            this.data.destroy();
            this.editing.destroy();
            this.keystrokes.destroy();
        })// Remove the editor from the context.
        // When the context was created by this editor, the context will be destroyed.
        .then(()=>this._context._removeEditor(this));
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
	 */ execute(commandName, ...commandParams) {
        try {
            return this.commands.execute(commandName, ...commandParams);
        } catch (err) {
            // @if CK_DEBUG // throw err;
            /* istanbul ignore next -- @preserve */ CKEditorError.rethrowUnexpectedError(err, this);
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
	 */ focus() {
        this.editing.view.focus();
    }
    /* istanbul ignore next -- @preserve */ /**
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
	 */ static create(...args) {
        throw new Error('This is an abstract method.');
    }
    /**
	 * The {@link module:core/context~Context} class.
	 *
	 * Exposed as static editor field for easier access in editor builds.
	 */ static Context = Context;
    /**
	 * The {@link module:watchdog/editorwatchdog~EditorWatchdog} class.
	 *
	 * Exposed as static editor field for easier access in editor builds.
	 */ static EditorWatchdog = EditorWatchdog;
    /**
	 * The {@link module:watchdog/contextwatchdog~ContextWatchdog} class.
	 *
	 * Exposed as static editor field for easier access in editor builds.
	 */ static ContextWatchdog = ContextWatchdog;
}
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

/**
 * Checks if the editor is initialized on a `<textarea>` element that belongs to a form. If yes, it updates the editor's element
 * content before submitting the form.
 *
 * This helper requires the {@link module:core/editor/utils/elementapimixin~ElementApi ElementApi interface}.
 *
 * @param editor Editor instance.
 */ function attachToForm(editor) {
    if (!isFunction(editor.updateSourceElement)) {
        /**
		 * The editor passed to `attachToForm()` must implement the
		 * {@link module:core/editor/utils/elementapimixin~ElementApi} interface.
		 *
		 * @error attachtoform-missing-elementapi-interface
		 */ throw new CKEditorError('attachtoform-missing-elementapi-interface', editor);
    }
    const sourceElement = editor.sourceElement;
    // Only when replacing a textarea which is inside of a form element.
    if (isTextArea(sourceElement) && sourceElement.form) {
        let originalSubmit;
        const form = sourceElement.form;
        const onSubmit = ()=>editor.updateSourceElement();
        // Replace the original form#submit() to call a custom submit function first.
        // Check if #submit is a function because the form might have an input named "submit".
        if (isFunction(form.submit)) {
            originalSubmit = form.submit;
            form.submit = ()=>{
                onSubmit();
                originalSubmit.apply(form);
            };
        }
        // Update the replaced textarea with data before each form#submit event.
        form.addEventListener('submit', onSubmit);
        // Remove the submit listener and revert the original submit method on
        // editor#destroy.
        editor.on('destroy', ()=>{
            form.removeEventListener('submit', onSubmit);
            if (originalSubmit) {
                form.submit = originalSubmit;
            }
        });
    }
}
function isTextArea(sourceElement) {
    return !!sourceElement && sourceElement.tagName.toLowerCase() === 'textarea';
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module core/editor/utils/dataapimixin
 */ /**
 * Implementation of the {@link module:core/editor/utils/dataapimixin~DataApi}.
 *
 * @deprecated This functionality is already implemented by the `Editor` class.
 */ function DataApiMixin(base) {
    return base;
}

/**
 * Implementation of the {@link module:core/editor/utils/elementapimixin~ElementApi}.
 */ function ElementApiMixin(base) {
    class Mixin extends base {
        sourceElement;
        updateSourceElement(data) {
            if (!this.sourceElement) {
                /**
				 * Cannot update the source element of a detached editor.
				 *
				 * The {@link module:core/editor/utils/elementapimixin~ElementApi#updateSourceElement `updateSourceElement()`}
				 * method cannot be called if you did not pass an element to `Editor.create()`.
				 *
				 * @error editor-missing-sourceelement
				 */ throw new CKEditorError('editor-missing-sourceelement', this);
            }
            const shouldUpdateSourceElement = this.config.get('updateSourceElementOnDestroy');
            const isSourceElementTextArea = this.sourceElement instanceof HTMLTextAreaElement;
            // The data returned by the editor might be unsafe, so we want to prevent rendering
            // unsafe content inside the source element different than <textarea>, which is considered
            // secure. This behavior could be changed by setting the `updateSourceElementOnDestroy`
            // configuration option to `true`.
            if (!shouldUpdateSourceElement && !isSourceElementTextArea) {
                setDataInElement(this.sourceElement, '');
                return;
            }
            const dataToSet = typeof data === 'string' ? data : this.data.get();
            setDataInElement(this.sourceElement, dataToSet);
        }
    }
    return Mixin;
}
// Backward compatibility with `mix`.
ElementApiMixin.updateSourceElement = ElementApiMixin(Object).prototype.updateSourceElement;

/**
 * Marks the source element on which the editor was initialized. This prevents other editor instances from using this element.
 *
 * Running multiple editor instances on the same source element causes various issues and it is
 * crucial this helper is called as soon as the source element is known to prevent collisions.
 *
 * @param editor Editor instance.
 * @param sourceElement Element to bind with the editor instance.
 */ function secureSourceElement(editor, sourceElement) {
    if (sourceElement.ckeditorInstance) {
        /**
		 * A DOM element used to create the editor (e.g.
		 * {@link module:editor-inline/inlineeditor~InlineEditor.create `InlineEditor.create()`})
		 * has already been used to create another editor instance. Make sure each editor is
		 * created with an unique DOM element.
		 *
		 * @error editor-source-element-already-used
		 * @param element DOM element that caused the collision.
		 */ throw new CKEditorError('editor-source-element-already-used', editor);
    }
    sourceElement.ckeditorInstance = editor;
    editor.once('destroy', ()=>{
        delete sourceElement.ckeditorInstance;
    });
}

/**
 * The list of pending editor actions.
 *
 * This plugin should be used to synchronise plugins that execute long-lasting actions
 * (e.g. file upload) with the editor integration. It gives the developer who integrates the editor
 * an easy way to check if there are any actions pending whenever such information is needed.
 * All plugins that register a pending action also provide a message about the action that is ongoing
 * which can be displayed to the user. This lets them decide if they want to interrupt the action or wait.
 *
 * Adding and updating a pending action:
 *
 * ```ts
 * const pendingActions = editor.plugins.get( 'PendingActions' );
 * const action = pendingActions.add( 'Upload in progress: 0%.' );
 *
 * // You can update the message:
 * action.message = 'Upload in progress: 10%.';
 * ```
 *
 * Removing a pending action:
 *
 * ```ts
 * const pendingActions = editor.plugins.get( 'PendingActions' );
 * const action = pendingActions.add( 'Unsaved changes.' );
 *
 * pendingActions.remove( action );
 * ```
 *
 * Getting pending actions:
 *
 * ```ts
 * const pendingActions = editor.plugins.get( 'PendingActions' );
 *
 * const action1 = pendingActions.add( 'Action 1' );
 * const action2 = pendingActions.add( 'Action 2' );
 *
 * pendingActions.first; // Returns action1
 * Array.from( pendingActions ); // Returns [ action1, action2 ]
 * ```
 *
 * This plugin is used by features like {@link module:upload/filerepository~FileRepository} to register their ongoing actions
 * and by features like {@link module:autosave/autosave~Autosave} to detect whether there are any ongoing actions.
 * Read more about saving the data in the
 * {@glink getting-started/setup/getting-and-setting-data Saving and getting data} guide.
 */ class PendingActions extends ContextPlugin {
    /**
	 * A list of pending actions.
	 */ _actions;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'PendingActions';
    }
    /**
	 * @inheritDoc
	 */ init() {
        this.set('hasAny', false);
        this._actions = new Collection({
            idProperty: '_id'
        });
        this._actions.delegate('add', 'remove').to(this);
    }
    /**
	 * Adds an action to the list of pending actions.
	 *
	 * This method returns an action object with an observable message property.
	 * The action object can be later used in the {@link #remove} method. It also allows you to change the message.
	 *
	 * @param message The action message.
	 * @returns An observable object that represents a pending action.
	 */ add(message) {
        if (typeof message !== 'string') {
            /**
			 * The message must be a string.
			 *
			 * @error pendingactions-add-invalid-message
			 */ throw new CKEditorError('pendingactions-add-invalid-message', this);
        }
        const action = new (ObservableMixin())();
        action.set('message', message);
        this._actions.add(action);
        this.hasAny = true;
        return action;
    }
    /**
	 * Removes an action from the list of pending actions.
	 *
	 * @param action An action object.
	 */ remove(action) {
        this._actions.remove(action);
        this.hasAny = !!this._actions.length;
    }
    /**
	 * Returns the first action from the list or null if the list is empty
	 *
	 * @returns The pending action object.
	 */ get first() {
        return this._actions.get(0);
    }
    /**
	 * Iterable interface.
	 */ [Symbol.iterator]() {
        return this._actions[Symbol.iterator]();
    }
}

var cancel = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m11.591 10.177 4.243 4.242a1 1 0 0 1-1.415 1.415l-4.242-4.243-4.243 4.243a1 1 0 0 1-1.414-1.415l4.243-4.242L4.52 5.934A1 1 0 0 1 5.934 4.52l4.243 4.243 4.242-4.243a1 1 0 1 1 1.415 1.414l-4.243 4.243z\"/></svg>";

var caption = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 16h9a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2z\"/><path d=\"M17 1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h14zm0 1.5H3a.5.5 0 0 0-.492.41L2.5 3v9a.5.5 0 0 0 .41.492L3 12.5h14a.5.5 0 0 0 .492-.41L17.5 12V3a.5.5 0 0 0-.41-.492L17 2.5z\" fill-opacity=\".6\"/></svg>";

var check = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6.972 16.615a.997.997 0 0 1-.744-.292l-4.596-4.596a1 1 0 1 1 1.414-1.414l3.926 3.926 9.937-9.937a1 1 0 0 1 1.414 1.415L7.717 16.323a.997.997 0 0 1-.745.292z\"/></svg>";

var cog = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m11.333 2 .19 2.263a5.899 5.899 0 0 1 1.458.604L14.714 3.4 16.6 5.286l-1.467 1.733c.263.452.468.942.605 1.46L18 8.666v2.666l-2.263.19a5.899 5.899 0 0 1-.604 1.458l1.467 1.733-1.886 1.886-1.733-1.467a5.899 5.899 0 0 1-1.46.605L11.334 18H8.667l-.19-2.263a5.899 5.899 0 0 1-1.458-.604L5.286 16.6 3.4 14.714l1.467-1.733a5.899 5.899 0 0 1-.604-1.458L2 11.333V8.667l2.262-.189a5.899 5.899 0 0 1 .605-1.459L3.4 5.286 5.286 3.4l1.733 1.467a5.899 5.899 0 0 1 1.46-.605L8.666 2h2.666zM10 6.267a3.733 3.733 0 1 0 0 7.466 3.733 3.733 0 0 0 0-7.466z\"/></svg>";

var colorPalette = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10.209 18.717A8.5 8.5 0 1 1 18.686 9.6h-.008l.002.12a3 3 0 0 1-2.866 2.997h-.268l-.046-.002v.002h-4.791a2 2 0 1 0 0 4 1 1 0 1 1-.128 1.992 8.665 8.665 0 0 1-.372.008Zm-3.918-7.01a1.25 1.25 0 1 0-2.415-.648 1.25 1.25 0 0 0 2.415.647ZM5.723 8.18a1.25 1.25 0 1 0 .647-2.414 1.25 1.25 0 0 0-.647 2.414ZM9.76 6.155a1.25 1.25 0 1 0 .647-2.415 1.25 1.25 0 0 0-.647 2.415Zm4.028 1.759a1.25 1.25 0 1 0 .647-2.415 1.25 1.25 0 0 0-.647 2.415Z\"/></svg>";

var eraser = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m8.636 9.531-2.758 3.94a.5.5 0 0 0 .122.696l3.224 2.284h1.314l2.636-3.736L8.636 9.53zm.288 8.451L5.14 15.396a2 2 0 0 1-.491-2.786l6.673-9.53a2 2 0 0 1 2.785-.49l3.742 2.62a2 2 0 0 1 .491 2.785l-7.269 10.053-2.147-.066z\"/><path d=\"M4 18h5.523v-1H4zm-2 0h1v-1H2z\"/></svg>";

var history = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11 1a9 9 0 1 1-8.027 13.075l1.128-1.129A7.502 7.502 0 0 0 18.5 10a7.5 7.5 0 1 0-14.962.759l-.745-.746-.76.76A9 9 0 0 1 11 1z\"/><path d=\"M.475 8.17a.75.75 0 0 1 .978.047l.075.082 1.284 1.643 1.681-1.284a.75.75 0 0 1 .978.057l.073.083a.75.75 0 0 1-.057.978l-.083.073-2.27 1.737a.75.75 0 0 1-.973-.052l-.074-.082-1.741-2.23a.75.75 0 0 1 .13-1.052z\"/><path d=\"M11.5 5v4.999l3.196 3.196-1.06 1.06L10.1 10.72l-.1-.113V5z\"/></svg>";

var lowVision = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5.085 6.22 2.943 4.078a.75.75 0 1 1 1.06-1.06l2.592 2.59A11.094 11.094 0 0 1 10 5.068c4.738 0 8.578 3.101 8.578 5.083 0 1.197-1.401 2.803-3.555 3.887l1.714 1.713a.75.75 0 0 1-.09 1.138.488.488 0 0 1-.15.084.75.75 0 0 1-.821-.16L6.17 7.304c-.258.11-.51.233-.757.365l6.239 6.24-.006.005.78.78c-.388.094-.78.166-1.174.215l-1.11-1.11h.011L4.55 8.197a7.2 7.2 0 0 0-.665.514l-.112.098 4.897 4.897-.005.006 1.276 1.276a10.164 10.164 0 0 1-1.477-.117l-.479-.479-.009.009-4.863-4.863-.022.031a2.563 2.563 0 0 0-.124.2c-.043.077-.08.158-.108.241a.534.534 0 0 0-.028.133.29.29 0 0 0 .008.072.927.927 0 0 0 .082.226c.067.133.145.26.234.379l3.242 3.365.025.01.59.623c-3.265-.918-5.59-3.155-5.59-4.668 0-1.194 1.448-2.838 3.663-3.93zm7.07.531a4.632 4.632 0 0 1 1.108 5.992l.345.344.046-.018a9.313 9.313 0 0 0 2-1.112c.256-.187.5-.392.727-.613.137-.134.27-.277.392-.431.072-.091.141-.185.203-.286.057-.093.107-.19.148-.292a.72.72 0 0 0 .036-.12.29.29 0 0 0 .008-.072.492.492 0 0 0-.028-.133.999.999 0 0 0-.036-.096 2.165 2.165 0 0 0-.071-.145 2.917 2.917 0 0 0-.125-.2 3.592 3.592 0 0 0-.263-.335 5.444 5.444 0 0 0-.53-.523 7.955 7.955 0 0 0-1.054-.768 9.766 9.766 0 0 0-1.879-.891c-.337-.118-.68-.219-1.027-.301zm-2.85.21-.069.002a.508.508 0 0 0-.254.097.496.496 0 0 0-.104.679.498.498 0 0 0 .326.199l.045.005c.091.003.181.003.272.012a2.45 2.45 0 0 1 2.017 1.513c.024.061.043.125.069.185a.494.494 0 0 0 .45.287h.008a.496.496 0 0 0 .35-.158.482.482 0 0 0 .13-.335.638.638 0 0 0-.048-.219 3.379 3.379 0 0 0-.36-.723 3.438 3.438 0 0 0-2.791-1.543l-.028-.001h-.013z\"/></svg>";

var textAlternative = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3.035 1C2.446 1 2 1.54 2 2.098V10.5h1.5v-8h13v8H18V2.098C18 1.539 17.48 1 16.9 1H3.035Zm10.453 2.61a1.885 1.885 0 0 0-1.442.736 1.89 1.89 0 0 0 1.011 2.976 1.903 1.903 0 0 0 2.253-1.114 1.887 1.887 0 0 0-1.822-2.598ZM7.463 8.163a.611.611 0 0 0-.432.154L5.071 10.5h5.119L7.88 8.348a.628.628 0 0 0-.417-.185Zm6.236 1.059a.62.62 0 0 0-.42.164L12.07 10.5h2.969l-.92-1.113a.618.618 0 0 0-.42-.165ZM.91 11.5a.91.91 0 0 0-.91.912v6.877c0 .505.405.91.91.91h18.178a.91.91 0 0 0 .912-.91v-6.877a.908.908 0 0 0-.912-.912H.91ZM3.668 13h1.947l2.135 5.7H5.898l-.28-.946H3.601l-.278.945H1.516L3.668 13Zm4.947 0h1.801v4.3h2.7v1.4h-4.5V13h-.001Zm4.5 0h5.4v1.4h-1.798v4.3h-1.701v-4.3h-1.9V13h-.001Zm-8.517 1.457-.614 2.059h1.262l-.648-2.059Z\"/></svg>";

var loupe = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12.68 13.74h-.001l4.209 4.208a1 1 0 1 0 1.414-1.414l-4.267-4.268a6 6 0 1 0-1.355 1.474ZM13 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z\"/></svg>";

var previousArrow = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11.463 5.187a.888.888 0 1 1 1.254 1.255L9.16 10l3.557 3.557a.888.888 0 1 1-1.254 1.255L7.26 10.61a.888.888 0 0 1 .16-1.382l4.043-4.042z\"/></svg>";

var nextArrow = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8.537 14.813a.888.888 0 1 1-1.254-1.255L10.84 10 7.283 6.442a.888.888 0 1 1 1.254-1.255L12.74 9.39a.888.888 0 0 1-.16 1.382l-4.043 4.042z\"/></svg>";

var image = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6.66 9.118a.693.693 0 0 1 .956.032l3.65 3.411 2.422-2.238a.695.695 0 0 1 .945 0L17.5 13.6V2.5h-15v11.1l4.16-4.482ZM17.8 1c.652 0 1.2.47 1.2 1.1v14.362c0 .64-.532 1.038-1.184 1.038H2.184C1.532 17.5 1 17.103 1 16.462V2.1C1 1.47 1.537 1 2.2 1h15.6Zm-5.655 6a2.128 2.128 0 0 1 .157-2.364A2.133 2.133 0 1 1 12.145 7Z\"/></svg>";

var imageUpload = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1.201 1C.538 1 0 1.47 0 2.1v14.363c0 .64.534 1.037 1.186 1.037h9.494a2.97 2.97 0 0 1-.414-.287 2.998 2.998 0 0 1-1.055-2.03 3.003 3.003 0 0 1 .693-2.185l.383-.455-.02.018-3.65-3.41a.695.695 0 0 0-.957-.034L1.5 13.6V2.5h15v5.535a2.97 2.97 0 0 1 1.412.932l.088.105V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.713 2.803a2.146 2.146 0 0 0-2.049 1.992 2.14 2.14 0 0 0 1.28 2.096 2.13 2.13 0 0 0 2.644-3.11 2.134 2.134 0 0 0-1.875-.978Z\"/><path d=\"M15.522 19.1a.79.79 0 0 0 .79-.79v-5.373l2.059 2.455a.79.79 0 1 0 1.211-1.015l-3.352-3.995a.79.79 0 0 0-.995-.179.784.784 0 0 0-.299.221l-3.35 3.99a.79.79 0 1 0 1.21 1.017l1.936-2.306v5.185c0 .436.353.79.79.79Z\"/><path d=\"M15.522 19.1a.79.79 0 0 0 .79-.79v-5.373l2.059 2.455a.79.79 0 1 0 1.211-1.015l-3.352-3.995a.79.79 0 0 0-.995-.179.784.784 0 0 0-.299.221l-3.35 3.99a.79.79 0 1 0 1.21 1.017l1.936-2.306v5.185c0 .436.353.79.79.79Z\"/></svg>";

var imageAssetManager = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1.201 1c-.662 0-1.2.47-1.2 1.1v14.248c0 .64.533 1.152 1.185 1.152h6.623v-7.236L6.617 9.15a.694.694 0 0 0-.957-.033L1.602 13.55V2.553l14.798.003V9.7H18V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.723 2.805a2.094 2.094 0 0 0-1.621.832 2.127 2.127 0 0 0 1.136 3.357 2.13 2.13 0 0 0 2.611-1.506 2.133 2.133 0 0 0-.76-2.244 2.13 2.13 0 0 0-1.366-.44Z\"/><path clip-rule=\"evenodd\" d=\"M19.898 12.369v6.187a.844.844 0 0 1-.844.844h-8.719a.844.844 0 0 1-.843-.844v-7.312a.844.844 0 0 1 .843-.844h2.531a.843.843 0 0 1 .597.248l.838.852h4.75c.223 0 .441.114.6.272a.844.844 0 0 1 .247.597Zm-1.52.654-4.377.02-1.1-1.143H11v6h7.4l-.023-4.877Z\"/></svg>";

var imageUrl = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1.201 1C.538 1 0 1.47 0 2.1v14.363c0 .64.534 1.037 1.186 1.037h7.029a5.401 5.401 0 0 1 .615-4.338l.762-1.232-2.975-2.78a.696.696 0 0 0-.957-.033L1.5 13.6V2.5h15v6.023c.449.131.887.32 1.307.573l.058.033c.046.028.09.057.135.086V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.713 2.803a2.15 2.15 0 0 0-1.611.834 2.118 2.118 0 0 0-.438 1.158 2.14 2.14 0 0 0 1.277 2.096 2.132 2.132 0 0 0 2.645-3.11 2.13 2.13 0 0 0-1.873-.978Z\"/><path d=\"M16.63 10.294a3.003 3.003 0 0 0-4.142.887l-.117.177a.647.647 0 0 0-.096.492.664.664 0 0 0 .278.418.7.7 0 0 0 .944-.234 1.741 1.741 0 0 1 2.478-.463 1.869 1.869 0 0 1 .476 2.55.637.637 0 0 0-.071.5.646.646 0 0 0 .309.396.627.627 0 0 0 .869-.19l.027-.041a3.226 3.226 0 0 0-.956-4.492Zm-6.061 3.78-.044.066a3.228 3.228 0 0 0 .82 4.403 3.005 3.005 0 0 0 4.275-.798l.13-.197a.626.626 0 0 0 .092-.475.638.638 0 0 0-.268-.402.713.713 0 0 0-.99.26l-.018.029a1.741 1.741 0 0 1-2.477.461 1.87 1.87 0 0 1-.475-2.55l.029-.047a.647.647 0 0 0 .086-.485.66.66 0 0 0-.275-.408l-.04-.027a.609.609 0 0 0-.845.17Z\"/><path d=\"M15.312 13.925c.24-.36.154-.838-.19-1.067-.346-.23-.82-.124-1.059.236l-1.268 1.907c-.239.36-.153.838.192 1.067.345.23.818.123 1.057-.236l1.268-1.907Z\"/></svg>";

var alignBottom = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m9.239 13.938-2.88-1.663a.75.75 0 0 1 .75-1.3L9 12.067V4.75a.75.75 0 1 1 1.5 0v7.318l1.89-1.093a.75.75 0 0 1 .75 1.3l-2.879 1.663a.752.752 0 0 1-.511.187.752.752 0 0 1-.511-.187zM4.25 17a.75.75 0 1 1 0-1.5h10.5a.75.75 0 0 1 0 1.5H4.25z\"/></svg>";

var alignMiddle = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.75 11.875a.752.752 0 0 1 .508.184l2.883 1.666a.75.75 0 0 1-.659 1.344l-.091-.044-1.892-1.093.001 4.318a.75.75 0 1 1-1.5 0v-4.317l-1.89 1.092a.75.75 0 0 1-.75-1.3l2.879-1.663a.752.752 0 0 1 .51-.187zM15.25 9a.75.75 0 1 1 0 1.5H4.75a.75.75 0 1 1 0-1.5h10.5zM9.75.375a.75.75 0 0 1 .75.75v4.318l1.89-1.093.092-.045a.75.75 0 0 1 .659 1.344l-2.883 1.667a.752.752 0 0 1-.508.184.752.752 0 0 1-.511-.187L6.359 5.65a.75.75 0 0 1 .75-1.299L9 5.442V1.125a.75.75 0 0 1 .75-.75z\"/></svg>";

var alignTop = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m10.261 7.062 2.88 1.663a.75.75 0 0 1-.75 1.3L10.5 8.933v7.317a.75.75 0 1 1-1.5 0V8.932l-1.89 1.093a.75.75 0 0 1-.75-1.3l2.879-1.663a.752.752 0 0 1 .511-.187.752.752 0 0 1 .511.187zM15.25 4a.75.75 0 1 1 0 1.5H4.75a.75.75 0 0 1 0-1.5h10.5z\"/></svg>";

var alignLeft = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 8c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 4c0 .414.336.75.75.75h9.929a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0-8c0 .414.336.75.75.75h9.929a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75z\"/></svg>";

var alignCenter = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 8c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm2.286 4c0 .414.336.75.75.75h9.928a.75.75 0 1 0 0-1.5H5.036a.75.75 0 0 0-.75.75zm0-8c0 .414.336.75.75.75h9.928a.75.75 0 1 0 0-1.5H5.036a.75.75 0 0 0-.75.75z\"/></svg>";

var alignRight = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 3.75a.75.75 0 0 1-.75.75H2.75a.75.75 0 1 1 0-1.5h14.5a.75.75 0 0 1 .75.75zm0 8a.75.75 0 0 1-.75.75H2.75a.75.75 0 1 1 0-1.5h14.5a.75.75 0 0 1 .75.75zm0 4a.75.75 0 0 1-.75.75H7.321a.75.75 0 1 1 0-1.5h9.929a.75.75 0 0 1 .75.75zm0-8a.75.75 0 0 1-.75.75H7.321a.75.75 0 1 1 0-1.5h9.929a.75.75 0 0 1 .75.75z\"/></svg>";

var alignJustify = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 8c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0 4c0 .414.336.75.75.75h9.929a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm0-8c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75z\"/></svg>";

var objectBlockLeft = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm0 12h16v1.5H2z\"/><path d=\"M12.003 7v5.5a1 1 0 0 1-1 1H2.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H3.5V12h6.997V7.5z\"/></svg>";

var objectCenter = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm0 12h16v1.5H2z\"/><path d=\"M15.003 7v5.5a1 1 0 0 1-1 1H5.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H6.5V12h6.997V7.5z\"/></svg>";

var objectBlockRight = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm0 12h16v1.5H2z\"/><path d=\"M18.003 7v5.5a1 1 0 0 1-1 1H8.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H9.5V12h6.997V7.5z\"/></svg>";

var objectFullWidth = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm0 12h16v1.5H2z\"/><path d=\"M18 7v5.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1zm-1.505.5H3.504V12h12.991V7.5z\"/></svg>";

var objectInline = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm11.5 9H18v1.5h-4.5zM2 15h16v1.5H2z\"/><path d=\"M12.003 7v5.5a1 1 0 0 1-1 1H2.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H3.5V12h6.997V7.5z\"/></svg>";

var objectLeft = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm11.5 9H18v1.5h-4.5zm0-3H18v1.5h-4.5zm0-3H18v1.5h-4.5zM2 15h16v1.5H2z\"/><path d=\"M12.003 7v5.5a1 1 0 0 1-1 1H2.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H3.5V12h6.997V7.5z\"/></svg>";

var objectRight = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path opacity=\".5\" d=\"M2 3h16v1.5H2zm0 12h16v1.5H2zm0-9h5v1.5H2zm0 3h5v1.5H2zm0 3h5v1.5H2z\"/><path d=\"M18.003 7v5.5a1 1 0 0 1-1 1H8.996a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h8.007a1 1 0 0 1 1 1zm-1.506.5H9.5V12h6.997V7.5z\"/></svg>";

var objectSizeFull = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path d=\"M2.5 17v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zm2 0v1h-1v-1h1zM1 15.5v1H0v-1h1zm19 0v1h-1v-1h1zm-19-2v1H0v-1h1zm19 0v1h-1v-1h1zm-19-2v1H0v-1h1zm19 0v1h-1v-1h1zm-19-2v1H0v-1h1zm19 0v1h-1v-1h1zm-19-2v1H0v-1h1zm19 0v1h-1v-1h1zm-19-2v1H0v-1h1zm19 0v1h-1v-1h1zm0-2v1h-1v-1h1zm-19 0v1H0v-1h1zM14.5 2v1h-1V2h1zm2 0v1h-1V2h1zm2 0v1h-1V2h1zm-8 0v1h-1V2h1zm-2 0v1h-1V2h1zm-2 0v1h-1V2h1zm-2 0v1h-1V2h1zm8 0v1h-1V2h1zm-10 0v1h-1V2h1z\"/><path d=\"M18.095 2H1.905C.853 2 0 2.895 0 4v12c0 1.105.853 2 1.905 2h16.19C19.147 18 20 17.105 20 16V4c0-1.105-.853-2-1.905-2zm0 1.5c.263 0 .476.224.476.5v12c0 .276-.213.5-.476.5H1.905a.489.489 0 0 1-.476-.5V4c0-.276.213-.5.476-.5h16.19z\"/></svg>";

var objectSizeCustom = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:v=\"https://vecta.io/nano\" viewBox=\"0 0 20 20\"><path d=\"M.95 1.43a.95.95 0 0 0-.95.95v3.1a.95.95 0 0 0 .95.95h.75v6.3H.95a.95.95 0 0 0-.95.95v3.1a.95.95 0 0 0 .95.95h3.1a.95.95 0 0 0 .95-.95v-.65h1.932l1.539-1.5H5v-.95a.95.95 0 0 0-.95-.95H3.2v-6.3h.85A.95.95 0 0 0 5 5.48v-.55h10v.55a.95.95 0 0 0 .95.95h3.1a.95.95 0 0 0 .95-.95v-3.1a.95.95 0 0 0-.95-.95h-3.1a.95.95 0 0 0-.95.95v1.05H5V2.38a.95.95 0 0 0-.95-.95H.95zm.55 3.5v-2h2v2h-2zm0 9.3v2h2v-2h-2zm15-11.3v2h2v-2h-2z\"/><path d=\"M8.139 20.004v-2.388l7.045-7.048 2.391 2.391-7.046 7.046h-2.39zm11.421-9.101a.64.64 0 0 1-.138.206l-1.165 1.168-2.391-2.391 1.167-1.163a.63.63 0 0 1 .206-.138.635.635 0 0 1 .243-.049.63.63 0 0 1 .449.187l1.491 1.488c.059.059.108.129.138.206s.049.16.049.243a.6.6 0 0 1-.049.243z\"/></svg>";

var objectSizeLarge = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2.5 16.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1ZM1 15v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 13v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 11v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 9v1H0V9h1Zm19 0v1h-1V9h1ZM1 7v1H0V7h1Zm19 0v1h-1V7h1ZM1 5v1H0V5h1Zm19 0v1h-1V5h1Zm0-2v1h-1V3h1ZM1 3v1H0V3h1Zm13.5-1.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm-8 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm8 0v1h-1v-1h1Zm-10 0v1h-1v-1h1Z\"/><path d=\"M13 5.5H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2ZM13 7a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-8A.5.5 0 0 1 2 7h11Z\"/></svg>";

var objectSizeSmall = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2.5 16.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1ZM1 15v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 13v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 11v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 9v1H0V9h1Zm19 0v1h-1V9h1ZM1 7v1H0V7h1Zm19 0v1h-1V7h1ZM1 5v1H0V5h1Zm19 0v1h-1V5h1Zm0-2v1h-1V3h1ZM1 3v1H0V3h1Zm13.5-1.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm-8 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm8 0v1h-1v-1h1Zm-10 0v1h-1v-1h1Z\"/><path d=\"M7 9.5H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2ZM7 11a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-4A.5.5 0 0 1 2 11h5Z\"/></svg>";

var objectSizeMedium = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2.5 16.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1ZM1 15v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 13v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 11v1H0v-1h1Zm19 0v1h-1v-1h1ZM1 9v1H0V9h1Zm19 0v1h-1V9h1ZM1 7v1H0V7h1Zm19 0v1h-1V7h1ZM1 5v1H0V5h1Zm19 0v1h-1V5h1Zm0-2v1h-1V3h1ZM1 3v1H0V3h1Zm13.5-1.5v1h-1v-1h1Zm2 0v1h-1v-1h1Zm2 0v1h-1v-1h1Zm-8 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm-2 0v1h-1v-1h1Zm8 0v1h-1v-1h1Zm-10 0v1h-1v-1h1Z\"/><path d=\"M10 7.5H2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2ZM10 9a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-6A.5.5 0 0 1 2 9h8Z\"/></svg>";

var pencil = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m7.3 17.37-.061.088a1.518 1.518 0 0 1-.934.535l-4.178.663-.806-4.153a1.495 1.495 0 0 1 .187-1.058l.056-.086L8.77 2.639c.958-1.351 2.803-1.076 4.296-.03 1.497 1.047 2.387 2.693 1.433 4.055L7.3 17.37zM9.14 4.728l-5.545 8.346 3.277 2.294 5.544-8.346L9.14 4.728zM6.07 16.512l-3.276-2.295.53 2.73 2.746-.435zM9.994 3.506 13.271 5.8c.316-.452-.16-1.333-1.065-1.966-.905-.634-1.895-.78-2.212-.328zM8 18.5 9.375 17H19v1.5H8z\"/></svg>";

var pilcrow = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6.999 2H15a1 1 0 0 1 0 2h-1.004v13a1 1 0 1 1-2 0V4H8.999v13a1 1 0 1 1-2 0v-7A4 4 0 0 1 3 6a4 4 0 0 1 3.999-4z\"/></svg>";

var quote = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 10.423a6.5 6.5 0 0 1 6.056-6.408l.038.67C6.448 5.423 5.354 7.663 5.22 10H9c.552 0 .5.432.5.986v4.511c0 .554-.448.503-1 .503h-5c-.552 0-.5-.449-.5-1.003v-4.574zm8 0a6.5 6.5 0 0 1 6.056-6.408l.038.67c-2.646.739-3.74 2.979-3.873 5.315H17c.552 0 .5.432.5.986v4.511c0 .554-.448.503-1 .503h-5c-.552 0-.5-.449-.5-1.003v-4.574z\"/></svg>";

var threeVerticalDots = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"9.5\" cy=\"4.5\" r=\"1.5\"/><circle cx=\"9.5\" cy=\"10.5\" r=\"1.5\"/><circle cx=\"9.5\" cy=\"16.5\" r=\"1.5\"/></svg>";

var dragIndicator = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3.25a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/><path d=\"M12 3.25a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/><path d=\"M5 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/><path d=\"M12 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/><path d=\"M5 16.75a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/><path d=\"M12 16.75a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0\"/></svg>";

var bold = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10.187 17H5.773c-.637 0-1.092-.138-1.364-.415-.273-.277-.409-.718-.409-1.323V4.738c0-.617.14-1.062.419-1.332.279-.27.73-.406 1.354-.406h4.68c.69 0 1.288.041 1.793.124.506.083.96.242 1.36.478.341.197.644.447.906.75a3.262 3.262 0 0 1 .808 2.162c0 1.401-.722 2.426-2.167 3.075C15.05 10.175 16 11.315 16 13.01a3.756 3.756 0 0 1-2.296 3.504 6.1 6.1 0 0 1-1.517.377c-.571.073-1.238.11-2 .11zm-.217-6.217H7v4.087h3.069c1.977 0 2.965-.69 2.965-2.072 0-.707-.256-1.22-.768-1.537-.512-.319-1.277-.478-2.296-.478zM7 5.13v3.619h2.606c.729 0 1.292-.067 1.69-.2a1.6 1.6 0 0 0 .91-.765c.165-.267.247-.566.247-.897 0-.707-.26-1.176-.778-1.409-.519-.232-1.31-.348-2.375-.348H7z\"/></svg>";

var paragraph = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10.5 5.5H7v5h3.5a2.5 2.5 0 1 0 0-5zM5 3h6.5v.025a5 5 0 0 1 0 9.95V13H7v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z\"/></svg>";

var plus = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 2a1 1 0 0 0-1 1v6H3a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V3a1 1 0 0 0-1-1Z\"/></svg>";

var text = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.816 11.5 7.038 4.785 4.261 11.5h5.555Zm.62 1.5H3.641l-1.666 4.028H.312l5.789-14h1.875l5.789 14h-1.663L10.436 13Z\"/><path d=\"m12.09 17-.534-1.292.848-1.971.545 1.319L12.113 17h-.023Zm1.142-5.187.545 1.319L15.5 9.13l1.858 4.316h-3.45l.398.965h3.467L18.887 17H20l-3.873-9h-1.254l-1.641 3.813Z\"/></svg>";

var importExport = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 4.5 14 0H3v12.673l.868-1.041c.185-.222.4-.402.632-.54V1.5h8v5h5v7.626a2.24 2.24 0 0 1 1.5.822V4.5ZM14 5V2l3.3 3H14Zm-3.692 12.5c.062.105.133.206.213.303L11.52 19H8v-.876a2.243 2.243 0 0 0 1.82-.624h.488Zm7.518-.657a.75.75 0 0 0-1.152-.96L15.5 17.29V12H14v5.29l-1.174-1.408a.75.75 0 0 0-1.152.96l2.346 2.816a.95.95 0 0 0 1.46 0l2.346-2.815Zm-15.056-.38a.75.75 0 0 1-.096-1.056l2.346-2.815a.95.95 0 0 1 1.46 0l2.346 2.815a.75.75 0 1 1-1.152.96L6.5 14.96V20H5v-5.04l-1.174 1.408a.75.75 0 0 1-1.056.096Z\"/></svg>";

var redo = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m14.958 9.367-2.189 1.837a.75.75 0 0 0 .965 1.149l3.788-3.18a.747.747 0 0 0 .21-.284.75.75 0 0 0-.17-.945L13.77 4.762a.75.75 0 1 0-.964 1.15l2.331 1.955H6.22A.75.75 0 0 0 6 7.9a4 4 0 1 0 1.477 7.718l-.344-1.489A2.5 2.5 0 1 1 6.039 9.4l-.008-.032h8.927z\"/></svg>";

var undo = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m5.042 9.367 2.189 1.837a.75.75 0 0 1-.965 1.149l-3.788-3.18a.747.747 0 0 1-.21-.284.75.75 0 0 1 .17-.945L6.23 4.762a.75.75 0 1 1 .964 1.15L4.863 7.866h8.917A.75.75 0 0 1 14 7.9a4 4 0 1 1-1.477 7.718l.344-1.489a2.5 2.5 0 1 0 1.094-4.73l.008-.032H5.042z\"/></svg>";

var bulletedList = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 5.75c0 .414.336.75.75.75h9.5a.75.75 0 1 0 0-1.5h-9.5a.75.75 0 0 0-.75.75zm-6 0C1 4.784 1.777 4 2.75 4c.966 0 1.75.777 1.75 1.75 0 .966-.777 1.75-1.75 1.75C1.784 7.5 1 6.723 1 5.75zm6 9c0 .414.336.75.75.75h9.5a.75.75 0 1 0 0-1.5h-9.5a.75.75 0 0 0-.75.75zm-6 0c0-.966.777-1.75 1.75-1.75.966 0 1.75.777 1.75 1.75 0 .966-.777 1.75-1.75 1.75-.966 0-1.75-.777-1.75-1.75z\"/></svg>";

var numberedList = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 5.75c0 .414.336.75.75.75h9.5a.75.75 0 1 0 0-1.5h-9.5a.75.75 0 0 0-.75.75zM3.5 3v5H2V3.7H1v-1h2.5V3zM.343 17.857l2.59-3.257H2.92a.6.6 0 1 0-1.04 0H.302a2 2 0 1 1 3.995 0h-.001c-.048.405-.16.734-.333.988-.175.254-.59.692-1.244 1.312H4.3v1h-4l.043-.043zM7 14.75a.75.75 0 0 1 .75-.75h9.5a.75.75 0 1 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z\"/></svg>";

var todoList = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m2.315 14.705 2.224-2.24a.689.689 0 0 1 .963 0 .664.664 0 0 1 0 .949L2.865 16.07a.682.682 0 0 1-.112.089.647.647 0 0 1-.852-.051L.688 14.886a.635.635 0 0 1 0-.903.647.647 0 0 1 .91 0l.717.722zm5.185.045a.75.75 0 0 1 .75-.75h9.5a.75.75 0 1 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75zM2.329 5.745l2.21-2.226a.689.689 0 0 1 .963 0 .664.664 0 0 1 0 .95L2.865 7.125a.685.685 0 0 1-.496.196.644.644 0 0 1-.468-.187L.688 5.912a.635.635 0 0 1 0-.903.647.647 0 0 1 .91 0l.73.736zM7.5 5.75A.75.75 0 0 1 8.25 5h9.5a.75.75 0 1 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75z\"/></svg>";

var codeBlock = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12.87 12.61a.75.75 0 0 1-.089.976l-.085.07-3.154 2.254 3.412 2.414a.75.75 0 0 1 .237.95l-.057.095a.75.75 0 0 1-.95.237l-.096-.058-4.272-3.022-.003-1.223 4.01-2.867a.75.75 0 0 1 1.047.174zm2.795-.231.095.057 4.011 2.867-.003 1.223-4.272 3.022-.095.058a.75.75 0 0 1-.88-.151l-.07-.086-.058-.095a.75.75 0 0 1 .15-.88l.087-.07 3.412-2.414-3.154-2.253-.085-.071a.75.75 0 0 1 .862-1.207zM16 0a2 2 0 0 1 2 2v9.354l-.663-.492-.837-.001V2a.5.5 0 0 0-.5-.5H2a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h3.118L7.156 19H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h14zM5.009 15l.003 1H3v-1h2.009zm2.188-2-1.471 1H5v-1h2.197zM10 11v.095L8.668 12H7v-1h3zm4-2v1H7V9h7zm0-2v1H7V7h7zm-4-2v1H5V5h5zM6 3v1H3V3h3z\"/></svg>";

var browseFiles = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M11.627 16.5zm5.873-.196zm0-7.001V8h-13v8.5h4.341c.191.54.457 1.044.785 1.5H2a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 2 2h4.5a1.5 1.5 0 0 1 1.06.44L9.122 4H16a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 19 8v2.531a6.027 6.027 0 0 0-1.5-1.228zM16 6.5v-1H8.5l-2-2H2v13h1V8a1.5 1.5 0 0 1 1.5-1.5H16z\"/><path d=\"M14.5 19.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM15 14v-2h-1v2h-2v1h2v2h1v-2h2v-1h-2z\"/></svg>";

var heading1 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 9v10h-2v-8h-2V9h4zM4 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V11H4v4.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v4.5z\"/></svg>";

var heading2 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V11H3v4.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H2a1 1 0 0 1 1 1v4.5zm16.076 8.343V18.5h-6.252c.067-.626.27-1.22.61-1.78.338-.561 1.006-1.305 2.005-2.232.804-.749 1.297-1.257 1.479-1.523.245-.368.368-.732.368-1.092 0-.398-.107-.703-.32-.917-.214-.214-.51-.32-.886-.32-.372 0-.669.111-.889.336-.22.224-.347.596-.38 1.117l-1.778-.178c.106-.982.438-1.686.997-2.114.558-.427 1.257-.64 2.095-.64.918 0 1.64.247 2.164.742.525.495.787 1.11.787 1.847 0 .419-.075.818-.225 1.197-.15.378-.388.775-.714 1.19-.216.275-.605.67-1.168 1.187-.563.516-.92.859-1.07 1.028a3.11 3.11 0 0 0-.365.495h3.542z\"/></svg>";

var heading3 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V11H3v4.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H2a1 1 0 0 1 1 1v4.5zm9.989 7.53 1.726-.209c.055.44.203.777.445 1.01.24.232.533.349.876.349.368 0 .678-.14.93-.42.251-.279.377-.655.377-1.13 0-.448-.12-.803-.362-1.066a1.153 1.153 0 0 0-.882-.393c-.228 0-.501.044-.819.133l.197-1.453c.482.012.85-.092 1.105-.315.253-.222.38-.517.38-.885 0-.313-.093-.563-.279-.75-.186-.185-.434-.278-.743-.278a1.07 1.07 0 0 0-.78.317c-.216.212-.347.52-.394.927l-1.644-.28c.114-.562.287-1.012.517-1.348.231-.337.553-.601.965-.794a3.24 3.24 0 0 1 1.387-.289c.876 0 1.579.28 2.108.838.436.457.653.973.653 1.549 0 .817-.446 1.468-1.339 1.955.533.114.96.37 1.28.768.319.398.478.878.478 1.441 0 .817-.298 1.513-.895 2.088-.596.576-1.339.864-2.228.864-.842 0-1.54-.243-2.094-.727-.555-.485-.876-1.118-.965-1.901z\"/></svg>";

var heading4 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3.5 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V11h-5v4.5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v4.5zm13.55 10v-1.873h-3.81v-1.561l4.037-5.91h1.498v5.904h1.156v1.567h-1.156V18.5H17.05zm0-3.44v-3.18l-2.14 3.18h2.14z\"/></svg>";

var heading5 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3.5 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V11h-5v4.5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v4.5zm9.578 7.607 1.777-.184c.05.402.201.72.45.955a1.223 1.223 0 0 0 1.81-.101c.258-.303.387-.759.387-1.368 0-.572-.128-1-.384-1.286-.256-.285-.59-.428-1-.428-.512 0-.971.226-1.377.679l-1.448-.21.915-4.843h4.716v1.67H15.56l-.28 1.58a2.697 2.697 0 0 1 1.219-.298 2.68 2.68 0 0 1 2.012.863c.55.576.825 1.323.825 2.241a3.36 3.36 0 0 1-.666 2.05c-.605.821-1.445 1.232-2.52 1.232-.86 0-1.56-.23-2.101-.692-.542-.461-.866-1.081-.971-1.86z\"/></svg>";

var heading6 = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3.5 8.5h5V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V11h-5v4.5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v4.5zm15.595 2.973-1.726.19c-.043-.355-.153-.617-.33-.787-.178-.169-.409-.253-.692-.253-.377 0-.695.169-.956.507-.26.339-.424 1.043-.492 2.114.445-.525.997-.787 1.657-.787.745 0 1.383.284 1.914.85.531.568.797 1.3.797 2.197 0 .952-.28 1.716-.838 2.291-.559.576-1.276.864-2.152.864-.94 0-1.712-.365-2.317-1.095-.605-.73-.908-1.927-.908-3.59 0-1.705.316-2.935.946-3.688.63-.753 1.45-1.13 2.457-1.13.706 0 1.291.198 1.755.594.463.395.758.97.885 1.723zm-4.043 3.891c0 .58.133 1.028.4 1.343.266.315.57.473.914.473.33 0 .605-.13.825-.388.22-.258.33-.68.33-1.27 0-.604-.118-1.047-.355-1.329a1.115 1.115 0 0 0-.89-.422c-.342 0-.632.134-.869.403s-.355.666-.355 1.19z\"/></svg>";

var horizontalLine = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 9h16v2H2z\"/></svg>";

var html = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M17 0a2 2 0 0 1 2 2v7a1 1 0 0 1 1 1v5a1 1 0 0 1-.883.993l-.118.006L19 17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2l-.001-1.001-.116-.006A1 1 0 0 1 0 15v-5a1 1 0 0 1 .999-1L1 2a2 2 0 0 1 2-2h14zm.499 15.999h-15L2.5 17a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5l-.001-1.001zm-3.478-6.013-.014.014H14v.007l-1.525 1.525-1.46-1.46-.015.013V10h-1v5h1v-3.53l1.428 1.43.048.043.131-.129L14 11.421V15h1v-5h-.965l-.014-.014zM2 10H1v5h1v-2h2v2h1v-5H4v2H2v-2zm7 0H6v1h1v4h1v-4h1v-1zm8 0h-1v5h3v-1h-2v-4zm0-8.5H3a.5.5 0 0 0-.5.5l-.001 6.999h15L17.5 2a.5.5 0 0 0-.5-.5zM10 7v1H4V7h6zm3-2v1H4V5h9zm-3-2v1H4V3h6z\"/></svg>";

var indent = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm5 6c0 .414.336.75.75.75h9.5a.75.75 0 1 0 0-1.5h-9.5a.75.75 0 0 0-.75.75zM2.75 16.5h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 1 0 0 1.5zM1.632 6.95 5.02 9.358a.4.4 0 0 1-.013.661l-3.39 2.207A.4.4 0 0 1 1 11.892V7.275a.4.4 0 0 1 .632-.326z\"/></svg>";

var outdent = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M2 3.75c0 .414.336.75.75.75h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 0 0-.75.75zm5 6c0 .414.336.75.75.75h9.5a.75.75 0 1 0 0-1.5h-9.5a.75.75 0 0 0-.75.75zM2.75 16.5h14.5a.75.75 0 1 0 0-1.5H2.75a.75.75 0 1 0 0 1.5zm1.618-9.55L.98 9.358a.4.4 0 0 0 .013.661l3.39 2.207A.4.4 0 0 0 5 11.892V7.275a.4.4 0 0 0-.632-.326z\"/></svg>";

var table = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 5.5v3h4v-3H3Zm0 4v3h4v-3H3Zm0 4v3h4v-3H3Zm5 3h4v-3H8v3Zm5 0h4v-3h-4v3Zm4-4v-3h-4v3h4Zm0-4v-3h-4v3h4Zm1.5 8A1.5 1.5 0 0 1 17 18H3a1.5 1.5 0 0 1-1.5-1.5V3c.222-.863 1.068-1.5 2-1.5h13c.932 0 1.778.637 2 1.5v13.5Zm-6.5-4v-3H8v3h4Zm0-4v-3H8v3h4Z\"/></svg>";

const icons = {
    bold,
    cancel,
    caption,
    check,
    cog,
    colorPalette,
    eraser,
    history,
    image,
    imageUpload,
    imageAssetManager,
    imageUrl,
    lowVision,
    textAlternative,
    loupe,
    previousArrow,
    nextArrow,
    importExport,
    paragraph,
    plus,
    text,
    alignBottom,
    alignMiddle,
    alignTop,
    alignLeft,
    alignCenter,
    alignRight,
    alignJustify,
    objectLeft,
    objectCenter,
    objectRight,
    objectFullWidth,
    objectInline,
    objectBlockLeft,
    objectBlockRight,
    objectSizeCustom,
    objectSizeFull,
    objectSizeLarge,
    objectSizeSmall,
    objectSizeMedium,
    pencil,
    pilcrow,
    quote,
    threeVerticalDots,
    dragIndicator,
    redo,
    undo,
    bulletedList,
    numberedList,
    todoList,
    codeBlock,
    browseFiles,
    heading1,
    heading2,
    heading3,
    heading4,
    heading5,
    heading6,
    horizontalLine,
    html,
    indent,
    outdent,
    table
};

export { Command, Context, ContextPlugin, DataApiMixin, Editor, ElementApiMixin, MultiCommand, PendingActions, Plugin, attachToForm, icons, secureSourceElement };
//# sourceMappingURL=index.js.map
