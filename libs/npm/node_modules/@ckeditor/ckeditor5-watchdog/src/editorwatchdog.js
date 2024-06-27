/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import areConnectedThroughProperties from './utils/areconnectedthroughproperties.js';
import Watchdog from './watchdog.js';
import { throttle, cloneDeepWith, isElement } from 'lodash-es';
/**
 * A watchdog for CKEditor 5 editors.
 *
 * See the {@glink features/watchdog Watchdog feature guide} to learn the rationale behind it and
 * how to use it.
 */
export default class EditorWatchdog extends Watchdog {
    /**
     * @param Editor The editor class.
     * @param watchdogConfig The watchdog plugin configuration.
     */
    constructor(Editor, watchdogConfig = {}) {
        super(watchdogConfig);
        /**
         * The current editor instance.
         */
        this._editor = null;
        /**
         * A promise associated with the life cycle of the editor (creation or destruction processes).
         *
         * It is used to prevent the initialization of the editor if the previous instance has not been destroyed yet,
         * and conversely, to prevent the destruction of the editor if it has not been initialized.
         */
        this._lifecyclePromise = null;
        /**
         * Specifies whether the editor was initialized using document data (`true`) or HTML elements (`false`).
         */
        this._initUsingData = true;
        /**
         * The latest record of the editor editable elements. Used to restart the editor.
         */
        this._editables = {};
        // this._editorClass = Editor;
        this._throttledSave = throttle(this._save.bind(this), typeof watchdogConfig.saveInterval === 'number' ? watchdogConfig.saveInterval : 5000);
        // Set default creator and destructor functions:
        if (Editor) {
            this._creator = ((elementOrData, config) => Editor.create(elementOrData, config));
        }
        this._destructor = editor => editor.destroy();
    }
    /**
     * The current editor instance.
     */
    get editor() {
        return this._editor;
    }
    /**
     * @internal
     */
    get _item() {
        return this._editor;
    }
    /**
     * Sets the function that is responsible for the editor creation.
     * It expects a function that should return a promise.
     *
     * ```ts
     * watchdog.setCreator( ( element, config ) => ClassicEditor.create( element, config ) );
     * ```
     */
    setCreator(creator) {
        this._creator = creator;
    }
    /**
     * Sets the function that is responsible for the editor destruction.
     * Overrides the default destruction function, which destroys only the editor instance.
     * It expects a function that should return a promise or `undefined`.
     *
     * ```ts
     * watchdog.setDestructor( editor => {
     * 	// Do something before the editor is destroyed.
     *
     * 	return editor
     * 		.destroy()
     * 		.then( () => {
     * 			// Do something after the editor is destroyed.
     * 		} );
     * } );
     * ```
     */
    setDestructor(destructor) {
        this._destructor = destructor;
    }
    /**
     * Restarts the editor instance. This method is called whenever an editor error occurs. It fires the `restart` event and changes
     * the state to `initializing`.
     *
     * @fires restart
     */
    _restart() {
        return Promise.resolve()
            .then(() => {
            this.state = 'initializing';
            this._fire('stateChange');
            return this._destroy();
        })
            .catch(err => {
            console.error('An error happened during the editor destroying.', err);
        })
            .then(() => {
            // Pre-process some data from the original editor config.
            // Our goal here is to make sure that the restarted editor will be reinitialized with correct set of roots.
            // We are not interested in any data set in config or in `.create()` first parameter. It will be replaced anyway.
            // But we need to set them correctly to make sure that proper roots are created.
            //
            // Since a different set of roots will be created, `lazyRoots` and `rootsAttributes` properties must be managed too.
            // Keys are root names, values are ''. Used when the editor was initialized by setting the first parameter to document data.
            const existingRoots = {};
            // Keeps lazy roots. They may be different when compared to initial config if some of the roots were loaded.
            const lazyRoots = [];
            // Roots attributes from the old config. Will be referred when setting new attributes.
            const oldRootsAttributes = this._config.rootsAttributes || {};
            // New attributes to be set. Is filled only for roots that still exist in the document.
            const rootsAttributes = {};
            // Traverse through the roots saved when the editor crashed and set up the discussed values.
            for (const [rootName, rootData] of Object.entries(this._data.roots)) {
                if (rootData.isLoaded) {
                    existingRoots[rootName] = '';
                    rootsAttributes[rootName] = oldRootsAttributes[rootName] || {};
                }
                else {
                    lazyRoots.push(rootName);
                }
            }
            const updatedConfig = {
                ...this._config,
                extraPlugins: this._config.extraPlugins || [],
                lazyRoots,
                rootsAttributes,
                _watchdogInitialData: this._data
            };
            // Delete `initialData` as it is not needed. Data will be set by the watchdog based on `_watchdogInitialData`.
            // First parameter of the editor `.create()` will be used to set up initial roots.
            delete updatedConfig.initialData;
            updatedConfig.extraPlugins.push(EditorWatchdogInitPlugin);
            if (this._initUsingData) {
                return this.create(existingRoots, updatedConfig, updatedConfig.context);
            }
            else {
                // Set correct editables to make sure that proper roots are created and linked with DOM elements.
                // No need to set initial data, as it would be discarded anyway.
                //
                // If one element was initially set in `elementOrData`, then use that original element to restart the editor.
                // This is for compatibility purposes with single-root editor types.
                if (isElement(this._elementOrData)) {
                    return this.create(this._elementOrData, updatedConfig, updatedConfig.context);
                }
                else {
                    return this.create(this._editables, updatedConfig, updatedConfig.context);
                }
            }
        })
            .then(() => {
            this._fire('restart');
        });
    }
    /**
     * Creates the editor instance and keeps it running, using the defined creator and destructor.
     *
     * @param elementOrData The editor source element or the editor data.
     * @param config The editor configuration.
     * @param context A context for the editor.
     */
    create(elementOrData = this._elementOrData, config = this._config, context) {
        this._lifecyclePromise = Promise.resolve(this._lifecyclePromise)
            .then(() => {
            super._startErrorHandling();
            this._elementOrData = elementOrData;
            // Use document data in the first parameter of the editor `.create()` call only if it was used like this originally.
            // Use document data if a string or object with strings was passed.
            this._initUsingData = typeof elementOrData == 'string' ||
                (Object.keys(elementOrData).length > 0 && typeof Object.values(elementOrData)[0] == 'string');
            // Clone configuration because it might be shared within multiple watchdog instances. Otherwise,
            // when an error occurs in one of these editors, the watchdog will restart all of them.
            this._config = this._cloneEditorConfiguration(config) || {};
            this._config.context = context;
            return this._creator(elementOrData, this._config);
        })
            .then(editor => {
            this._editor = editor;
            editor.model.document.on('change:data', this._throttledSave);
            this._lastDocumentVersion = editor.model.document.version;
            this._data = this._getData();
            if (!this._initUsingData) {
                this._editables = this._getEditables();
            }
            this.state = 'ready';
            this._fire('stateChange');
        }).finally(() => {
            this._lifecyclePromise = null;
        });
        return this._lifecyclePromise;
    }
    /**
     * Destroys the watchdog and the current editor instance. It fires the callback
     * registered in {@link #setDestructor `setDestructor()`} and uses it to destroy the editor instance.
     * It also sets the state to `destroyed`.
     */
    destroy() {
        this._lifecyclePromise = Promise.resolve(this._lifecyclePromise)
            .then(() => {
            this.state = 'destroyed';
            this._fire('stateChange');
            super.destroy();
            return this._destroy();
        }).finally(() => {
            this._lifecyclePromise = null;
        });
        return this._lifecyclePromise;
    }
    _destroy() {
        return Promise.resolve()
            .then(() => {
            this._stopErrorHandling();
            this._throttledSave.cancel();
            const editor = this._editor;
            this._editor = null;
            // Remove the `change:data` listener before destroying the editor.
            // Incorrectly written plugins may trigger firing `change:data` events during the editor destruction phase
            // causing the watchdog to call `editor.getData()` when some parts of editor are already destroyed.
            editor.model.document.off('change:data', this._throttledSave);
            return this._destructor(editor);
        });
    }
    /**
     * Saves the editor data, so it can be restored after the crash even if the data cannot be fetched at
     * the moment of the crash.
     */
    _save() {
        const version = this._editor.model.document.version;
        try {
            this._data = this._getData();
            if (!this._initUsingData) {
                this._editables = this._getEditables();
            }
            this._lastDocumentVersion = version;
        }
        catch (err) {
            console.error(err, 'An error happened during restoring editor data. ' +
                'Editor will be restored from the previously saved data.');
        }
    }
    /**
     * @internal
     */
    _setExcludedProperties(props) {
        this._excludedProps = props;
    }
    /**
     * Gets all data that is required to reinitialize editor instance.
     */
    _getData() {
        const editor = this._editor;
        const roots = editor.model.document.roots.filter(root => root.isAttached() && root.rootName != '$graveyard');
        const { plugins } = editor;
        // `as any` to avoid linking from external private repo.
        const commentsRepository = plugins.has('CommentsRepository') && plugins.get('CommentsRepository');
        const trackChanges = plugins.has('TrackChanges') && plugins.get('TrackChanges');
        const data = {
            roots: {},
            markers: {},
            commentThreads: JSON.stringify([]),
            suggestions: JSON.stringify([])
        };
        roots.forEach(root => {
            data.roots[root.rootName] = {
                content: JSON.stringify(Array.from(root.getChildren())),
                attributes: JSON.stringify(Array.from(root.getAttributes())),
                isLoaded: root._isLoaded
            };
        });
        for (const marker of editor.model.markers) {
            if (!marker._affectsData) {
                continue;
            }
            data.markers[marker.name] = {
                rangeJSON: marker.getRange().toJSON(),
                usingOperation: marker._managedUsingOperations,
                affectsData: marker._affectsData
            };
        }
        if (commentsRepository) {
            data.commentThreads = JSON.stringify(commentsRepository.getCommentThreads({ toJSON: true, skipNotAttached: true }));
        }
        if (trackChanges) {
            data.suggestions = JSON.stringify(trackChanges.getSuggestions({ toJSON: true, skipNotAttached: true }));
        }
        return data;
    }
    /**
     * For each attached model root, returns its HTML editable element (if available).
     */
    _getEditables() {
        const editables = {};
        for (const rootName of this.editor.model.document.getRootNames()) {
            const editable = this.editor.ui.getEditableElement(rootName);
            if (editable) {
                editables[rootName] = editable;
            }
        }
        return editables;
    }
    /**
     * Traverses the error context and the current editor to find out whether these structures are connected
     * to each other via properties.
     *
     * @internal
     */
    _isErrorComingFromThisItem(error) {
        return areConnectedThroughProperties(this._editor, error.context, this._excludedProps);
    }
    /**
     * Clones the editor configuration.
     */
    _cloneEditorConfiguration(config) {
        return cloneDeepWith(config, (value, key) => {
            // Leave DOM references.
            if (isElement(value)) {
                return value;
            }
            if (key === 'context') {
                return value;
            }
        });
    }
}
/**
 * Internal plugin that is used to stop the default editor initialization and restoring the editor state
 * based on the `editor.config._watchdogInitialData` data.
 */
class EditorWatchdogInitPlugin {
    constructor(editor) {
        this.editor = editor;
        this._data = editor.config.get('_watchdogInitialData');
    }
    /**
     * @inheritDoc
     */
    init() {
        // Stops the default editor initialization and use the saved data to restore the editor state.
        // Some of data could not be initialize as a config properties. It is important to keep the data
        // in the same form as it was before the restarting.
        this.editor.data.on('init', evt => {
            evt.stop();
            this.editor.model.enqueueChange({ isUndoable: false }, writer => {
                this._restoreCollaborationData();
                this._restoreEditorData(writer);
            });
            this.editor.data.fire('ready');
            // Keep priority `'high' - 1` to be sure that RTC initialization will be first.
        }, { priority: 1000 - 1 });
    }
    /**
     * Creates a model node (element or text) based on provided JSON.
     */
    _createNode(writer, jsonNode) {
        if ('name' in jsonNode) {
            // If child has name property, it is an Element.
            const element = writer.createElement(jsonNode.name, jsonNode.attributes);
            if (jsonNode.children) {
                for (const child of jsonNode.children) {
                    element._appendChild(this._createNode(writer, child));
                }
            }
            return element;
        }
        else {
            // Otherwise, it is a Text node.
            return writer.createText(jsonNode.data, jsonNode.attributes);
        }
    }
    /**
     * Restores the editor by setting the document data, roots attributes and markers.
     */
    _restoreEditorData(writer) {
        const editor = this.editor;
        Object.entries(this._data.roots).forEach(([rootName, { content, attributes }]) => {
            const parsedNodes = JSON.parse(content);
            const parsedAttributes = JSON.parse(attributes);
            const rootElement = editor.model.document.getRoot(rootName);
            for (const [key, value] of parsedAttributes) {
                writer.setAttribute(key, value, rootElement);
            }
            for (const child of parsedNodes) {
                const node = this._createNode(writer, child);
                writer.insert(node, rootElement, 'end');
            }
        });
        Object.entries(this._data.markers).forEach(([markerName, markerOptions]) => {
            const { document } = editor.model;
            const { rangeJSON: { start, end }, ...options } = markerOptions;
            const root = document.getRoot(start.root);
            const startPosition = writer.createPositionFromPath(root, start.path, start.stickiness);
            const endPosition = writer.createPositionFromPath(root, end.path, end.stickiness);
            const range = writer.createRange(startPosition, endPosition);
            writer.addMarker(markerName, {
                range,
                ...options
            });
        });
    }
    /**
     * Restores the editor collaboration data - comment threads and suggestions.
     */
    _restoreCollaborationData() {
        // `as any` to avoid linking from external private repo.
        const parsedCommentThreads = JSON.parse(this._data.commentThreads);
        const parsedSuggestions = JSON.parse(this._data.suggestions);
        parsedCommentThreads.forEach(commentThreadData => {
            const channelId = this.editor.config.get('collaboration.channelId');
            const commentsRepository = this.editor.plugins.get('CommentsRepository');
            if (commentsRepository.hasCommentThread(commentThreadData.threadId)) {
                const commentThread = commentsRepository.getCommentThread(commentThreadData.threadId);
                commentThread.remove();
            }
            commentsRepository.addCommentThread({ channelId, ...commentThreadData });
        });
        parsedSuggestions.forEach(suggestionData => {
            const trackChangesEditing = this.editor.plugins.get('TrackChangesEditing');
            if (trackChangesEditing.hasSuggestion(suggestionData.id)) {
                const suggestion = trackChangesEditing.getSuggestion(suggestionData.id);
                suggestion.attributes = suggestionData.attributes;
            }
            else {
                trackChangesEditing.addSuggestionData(suggestionData);
            }
        });
    }
}
