/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { throttle, isElement, cloneDeepWith } from 'lodash-es';

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module watchdog/watchdog
 */ /* globals window */ // eslint-disable-next-line ckeditor5-rules/no-cross-package-imports
/**
 * An abstract watchdog class that handles most of the error handling process and the state of the underlying component.
 *
 * See the {@glink features/watchdog Watchdog feature guide} to learn the rationale behind it and how to use it.
 *
 * @internal
 */ class Watchdog {
    /**
	 * An array of crashes saved as an object with the following properties:
	 *
	 * * `message`: `String`,
	 * * `stack`: `String`,
	 * * `date`: `Number`,
	 * * `filename`: `String | undefined`,
	 * * `lineno`: `Number | undefined`,
	 * * `colno`: `Number | undefined`,
	 */ crashes = [];
    /**
	 * Specifies the state of the item watched by the watchdog. The state can be one of the following values:
	 *
	 * * `initializing` &ndash; Before the first initialization, and after crashes, before the item is ready.
	 * * `ready` &ndash; A state when the user can interact with the item.
	 * * `crashed` &ndash; A state when an error occurs. It quickly changes to `initializing` or `crashedPermanently`
	 * depending on how many and how frequent errors have been caught recently.
	 * * `crashedPermanently` &ndash; A state when the watchdog stops reacting to errors and keeps the item it is watching crashed,
	 * * `destroyed` &ndash; A state when the item is manually destroyed by the user after calling `watchdog.destroy()`.
	 */ state = 'initializing';
    /**
	 * @see module:watchdog/watchdog~WatchdogConfig
	 */ _crashNumberLimit;
    /**
	 * Returns the result of the `Date.now()` call. It can be overridden in tests to mock time as some popular
	 * approaches like `sinon.useFakeTimers()` do not work well with error handling.
	 */ _now = Date.now;
    /**
	 * @see module:watchdog/watchdog~WatchdogConfig
	 */ _minimumNonErrorTimePeriod;
    /**
	 * Checks if the event error comes from the underlying item and restarts the item.
	 */ _boundErrorHandler;
    /**
	 * A dictionary of event emitter listeners.
	 */ _listeners;
    /**
	 * @param {module:watchdog/watchdog~WatchdogConfig} config The watchdog plugin configuration.
	 */ constructor(config){
        this.crashes = [];
        this._crashNumberLimit = typeof config.crashNumberLimit === 'number' ? config.crashNumberLimit : 3;
        this._minimumNonErrorTimePeriod = typeof config.minimumNonErrorTimePeriod === 'number' ? config.minimumNonErrorTimePeriod : 5000;
        this._boundErrorHandler = (evt)=>{
            // `evt.error` is exposed by EventError while `evt.reason` is available in PromiseRejectionEvent.
            const error = 'error' in evt ? evt.error : evt.reason;
            // Note that `evt.reason` might be everything that is in the promise rejection.
            // Similarly everything that is thrown lands in `evt.error`.
            if (error instanceof Error) {
                this._handleError(error, evt);
            }
        };
        this._listeners = {};
        if (!this._restart) {
            throw new Error('The Watchdog class was split into the abstract `Watchdog` class and the `EditorWatchdog` class. ' + 'Please, use `EditorWatchdog` if you have used the `Watchdog` class previously.');
        }
    }
    /**
	 * Destroys the watchdog and releases the resources.
	 */ destroy() {
        this._stopErrorHandling();
        this._listeners = {};
    }
    /**
	 * Starts listening to a specific event name by registering a callback that will be executed
	 * whenever an event with a given name fires.
	 *
	 * Note that this method differs from the CKEditor 5's default `EventEmitterMixin` implementation.
	 *
	 * @param eventName The event name.
	 * @param callback A callback which will be added to event listeners.
	 */ on(eventName, callback) {
        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        this._listeners[eventName].push(callback);
    }
    /**
	 * Stops listening to the specified event name by removing the callback from event listeners.
	 *
	 * Note that this method differs from the CKEditor 5's default `EventEmitterMixin` implementation.
	 *
	 * @param eventName The event name.
	 * @param callback A callback which will be removed from event listeners.
	 */ off(eventName, callback) {
        this._listeners[eventName] = this._listeners[eventName].filter((cb)=>cb !== callback);
    }
    /**
	 * Fires an event with a given event name and arguments.
	 *
	 * Note that this method differs from the CKEditor 5's default `EventEmitterMixin` implementation.
	 */ _fire(eventName, ...args) {
        const callbacks = this._listeners[eventName] || [];
        for (const callback of callbacks){
            callback.apply(this, [
                null,
                ...args
            ]);
        }
    }
    /**
	 * Starts error handling by attaching global error handlers.
	 */ _startErrorHandling() {
        window.addEventListener('error', this._boundErrorHandler);
        window.addEventListener('unhandledrejection', this._boundErrorHandler);
    }
    /**
	 * Stops error handling by detaching global error handlers.
	 */ _stopErrorHandling() {
        window.removeEventListener('error', this._boundErrorHandler);
        window.removeEventListener('unhandledrejection', this._boundErrorHandler);
    }
    /**
	 * Checks if an error comes from the watched item and restarts it.
	 * It reacts to {@link module:utils/ckeditorerror~CKEditorError `CKEditorError` errors} only.
	 *
	 * @fires error
	 * @param error Error.
	 * @param evt An error event.
	 */ _handleError(error, evt) {
        // @if CK_DEBUG // const err = error as CKEditorError;
        // @if CK_DEBUG // if ( err.is && err.is( 'CKEditorError' ) && err.context === undefined ) {
        // @if CK_DEBUG // console.warn( 'The error is missing its context and Watchdog cannot restart the proper item.' );
        // @if CK_DEBUG // }
        if (this._shouldReactToError(error)) {
            this.crashes.push({
                message: error.message,
                stack: error.stack,
                // `evt.filename`, `evt.lineno` and `evt.colno` are available only in ErrorEvent events
                filename: evt instanceof ErrorEvent ? evt.filename : undefined,
                lineno: evt instanceof ErrorEvent ? evt.lineno : undefined,
                colno: evt instanceof ErrorEvent ? evt.colno : undefined,
                date: this._now()
            });
            const causesRestart = this._shouldRestart();
            this.state = 'crashed';
            this._fire('stateChange');
            this._fire('error', {
                error,
                causesRestart
            });
            if (causesRestart) {
                this._restart();
            } else {
                this.state = 'crashedPermanently';
                this._fire('stateChange');
            }
        }
    }
    /**
	 * Checks whether an error should be handled by the watchdog.
	 *
	 * @param error An error that was caught by the error handling process.
	 */ _shouldReactToError(error) {
        return error.is && error.is('CKEditorError') && error.context !== undefined && // In some cases the watched item should not be restarted - e.g. during the item initialization.
        // That's why the `null` was introduced as a correct error context which does cause restarting.
        error.context !== null && // Do not react to errors if the watchdog is in states other than `ready`.
        this.state === 'ready' && this._isErrorComingFromThisItem(error);
    }
    /**
	 * Checks if the watchdog should restart the underlying item.
	 */ _shouldRestart() {
        if (this.crashes.length <= this._crashNumberLimit) {
            return true;
        }
        const lastErrorTime = this.crashes[this.crashes.length - 1].date;
        const firstMeaningfulErrorTime = this.crashes[this.crashes.length - 1 - this._crashNumberLimit].date;
        const averageNonErrorTimePeriod = (lastErrorTime - firstMeaningfulErrorTime) / this._crashNumberLimit;
        return averageNonErrorTimePeriod > this._minimumNonErrorTimePeriod;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module watchdog/utils/getsubnodes
 */ /* globals EventTarget, Event */ function getSubNodes(head, excludedProperties = new Set()) {
    const nodes = [
        head
    ];
    // @if CK_DEBUG_WATCHDOG // const prevNodeMap = new Map();
    // Nodes are stored to prevent infinite looping.
    const subNodes = new Set();
    let nodeIndex = 0;
    while(nodes.length > nodeIndex){
        // Incrementing the iterator is much faster than changing size of the array with Array.prototype.shift().
        const node = nodes[nodeIndex++];
        if (subNodes.has(node) || !shouldNodeBeIncluded(node) || excludedProperties.has(node)) {
            continue;
        }
        subNodes.add(node);
        // Handle arrays, maps, sets, custom collections that implements `[ Symbol.iterator ]()`, etc.
        if (Symbol.iterator in node) {
            // The custom editor iterators might cause some problems if the editor is crashed.
            try {
                for (const n of node){
                    nodes.push(n);
                // @if CK_DEBUG_WATCHDOG // if ( !prevNodeMap.has( n ) ) {
                // @if CK_DEBUG_WATCHDOG // 	prevNodeMap.set( n, node );
                // @if CK_DEBUG_WATCHDOG // }
                }
            } catch (err) {
            // Do not log errors for broken structures
            // since we are in the error handling process already.
            // eslint-disable-line no-empty
            }
        } else {
            for(const key in node){
                // We share a reference via the protobuf library within the editors,
                // hence the shared value should be skipped. Although, it's not a perfect
                // solution since new places like that might occur in the future.
                if (key === 'defaultValue') {
                    continue;
                }
                nodes.push(node[key]);
            // @if CK_DEBUG_WATCHDOG // if ( !prevNodeMap.has( node[ key ] ) ) {
            // @if CK_DEBUG_WATCHDOG // 	prevNodeMap.set( node[ key ], node );
            // @if CK_DEBUG_WATCHDOG // }
            }
        }
    }
    // @if CK_DEBUG_WATCHDOG // return { subNodes, prevNodeMap } as any;
    return subNodes;
}
function shouldNodeBeIncluded(node) {
    const type = Object.prototype.toString.call(node);
    const typeOfNode = typeof node;
    return !(typeOfNode === 'number' || typeOfNode === 'boolean' || typeOfNode === 'string' || typeOfNode === 'symbol' || typeOfNode === 'function' || type === '[object Date]' || type === '[object RegExp]' || type === '[object Module]' || node === undefined || node === null || // This flag is meant to exclude singletons shared across editor instances. So when an error is thrown in one editor,
    // the other editors connected through the reference to the same singleton are not restarted. This is a temporary workaround
    // until a better solution is found.
    // More in https://github.com/ckeditor/ckeditor5/issues/12292.
    node._watchdogExcluded || // Skip native DOM objects, e.g. Window, nodes, events, etc.
    node instanceof EventTarget || node instanceof Event);
}

/**
 * Traverses both structures to find out whether there is a reference that is shared between both structures.
 */ function areConnectedThroughProperties(target1, target2, excludedNodes = new Set()) {
    if (target1 === target2 && isObject(target1)) {
        return true;
    }
    // @if CK_DEBUG_WATCHDOG // return checkConnectionBetweenProps( target1, target2, excludedNodes );
    const subNodes1 = getSubNodes(target1, excludedNodes);
    const subNodes2 = getSubNodes(target2, excludedNodes);
    for (const node of subNodes1){
        if (subNodes2.has(node)) {
            return true;
        }
    }
    return false;
}
function isObject(structure) {
    return typeof structure === 'object' && structure !== null;
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module watchdog/editorwatchdog
 */ /* globals console */ // eslint-disable-next-line ckeditor5-rules/no-cross-package-imports
/**
 * A watchdog for CKEditor 5 editors.
 *
 * See the {@glink features/watchdog Watchdog feature guide} to learn the rationale behind it and
 * how to use it.
 */ class EditorWatchdog extends Watchdog {
    /**
	 * The current editor instance.
	 */ _editor = null;
    /**
	 * A promise associated with the life cycle of the editor (creation or destruction processes).
	 *
	 * It is used to prevent the initialization of the editor if the previous instance has not been destroyed yet,
	 * and conversely, to prevent the destruction of the editor if it has not been initialized.
	 */ _lifecyclePromise = null;
    /**
	 * Throttled save method. The `save()` method is called the specified `saveInterval` after `throttledSave()` is called,
	 * unless a new action happens in the meantime.
	 */ _throttledSave;
    /**
	 * The latest saved editor data represented as a root name -> root data object.
	 */ _data;
    /**
	 * The last document version.
	 */ _lastDocumentVersion;
    /**
	 * The editor source element or data.
	 */ _elementOrData;
    /**
	 * Specifies whether the editor was initialized using document data (`true`) or HTML elements (`false`).
	 */ _initUsingData = true;
    /**
	 * The latest record of the editor editable elements. Used to restart the editor.
	 */ _editables = {};
    /**
	 * The editor configuration.
	 */ _config;
    _excludedProps;
    /**
	 * @param Editor The editor class.
	 * @param watchdogConfig The watchdog plugin configuration.
	 */ constructor(Editor, watchdogConfig = {}){
        super(watchdogConfig);
        // this._editorClass = Editor;
        this._throttledSave = throttle(this._save.bind(this), typeof watchdogConfig.saveInterval === 'number' ? watchdogConfig.saveInterval : 5000);
        // Set default creator and destructor functions:
        if (Editor) {
            this._creator = (elementOrData, config)=>Editor.create(elementOrData, config);
        }
        this._destructor = (editor)=>editor.destroy();
    }
    /**
	 * The current editor instance.
	 */ get editor() {
        return this._editor;
    }
    /**
	 * @internal
	 */ get _item() {
        return this._editor;
    }
    /**
	 * Sets the function that is responsible for the editor creation.
	 * It expects a function that should return a promise.
	 *
	 * ```ts
	 * watchdog.setCreator( ( element, config ) => ClassicEditor.create( element, config ) );
	 * ```
	 */ setCreator(creator) {
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
	 */ setDestructor(destructor) {
        this._destructor = destructor;
    }
    /**
	 * Restarts the editor instance. This method is called whenever an editor error occurs. It fires the `restart` event and changes
	 * the state to `initializing`.
	 *
	 * @fires restart
	 */ _restart() {
        return Promise.resolve().then(()=>{
            this.state = 'initializing';
            this._fire('stateChange');
            return this._destroy();
        }).catch((err)=>{
            console.error('An error happened during the editor destroying.', err);
        }).then(()=>{
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
            for (const [rootName, rootData] of Object.entries(this._data.roots)){
                if (rootData.isLoaded) {
                    existingRoots[rootName] = '';
                    rootsAttributes[rootName] = oldRootsAttributes[rootName] || {};
                } else {
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
            } else {
                // Set correct editables to make sure that proper roots are created and linked with DOM elements.
                // No need to set initial data, as it would be discarded anyway.
                //
                // If one element was initially set in `elementOrData`, then use that original element to restart the editor.
                // This is for compatibility purposes with single-root editor types.
                if (isElement(this._elementOrData)) {
                    return this.create(this._elementOrData, updatedConfig, updatedConfig.context);
                } else {
                    return this.create(this._editables, updatedConfig, updatedConfig.context);
                }
            }
        }).then(()=>{
            this._fire('restart');
        });
    }
    /**
	 * Creates the editor instance and keeps it running, using the defined creator and destructor.
	 *
	 * @param elementOrData The editor source element or the editor data.
	 * @param config The editor configuration.
	 * @param context A context for the editor.
	 */ create(elementOrData = this._elementOrData, config = this._config, context) {
        this._lifecyclePromise = Promise.resolve(this._lifecyclePromise).then(()=>{
            super._startErrorHandling();
            this._elementOrData = elementOrData;
            // Use document data in the first parameter of the editor `.create()` call only if it was used like this originally.
            // Use document data if a string or object with strings was passed.
            this._initUsingData = typeof elementOrData == 'string' || Object.keys(elementOrData).length > 0 && typeof Object.values(elementOrData)[0] == 'string';
            // Clone configuration because it might be shared within multiple watchdog instances. Otherwise,
            // when an error occurs in one of these editors, the watchdog will restart all of them.
            this._config = this._cloneEditorConfiguration(config) || {};
            this._config.context = context;
            return this._creator(elementOrData, this._config);
        }).then((editor)=>{
            this._editor = editor;
            editor.model.document.on('change:data', this._throttledSave);
            this._lastDocumentVersion = editor.model.document.version;
            this._data = this._getData();
            if (!this._initUsingData) {
                this._editables = this._getEditables();
            }
            this.state = 'ready';
            this._fire('stateChange');
        }).finally(()=>{
            this._lifecyclePromise = null;
        });
        return this._lifecyclePromise;
    }
    /**
	 * Destroys the watchdog and the current editor instance. It fires the callback
	 * registered in {@link #setDestructor `setDestructor()`} and uses it to destroy the editor instance.
	 * It also sets the state to `destroyed`.
	 */ destroy() {
        this._lifecyclePromise = Promise.resolve(this._lifecyclePromise).then(()=>{
            this.state = 'destroyed';
            this._fire('stateChange');
            super.destroy();
            return this._destroy();
        }).finally(()=>{
            this._lifecyclePromise = null;
        });
        return this._lifecyclePromise;
    }
    _destroy() {
        return Promise.resolve().then(()=>{
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
	 */ _save() {
        const version = this._editor.model.document.version;
        try {
            this._data = this._getData();
            if (!this._initUsingData) {
                this._editables = this._getEditables();
            }
            this._lastDocumentVersion = version;
        } catch (err) {
            console.error(err, 'An error happened during restoring editor data. ' + 'Editor will be restored from the previously saved data.');
        }
    }
    /**
	 * @internal
	 */ _setExcludedProperties(props) {
        this._excludedProps = props;
    }
    /**
	 * Gets all data that is required to reinitialize editor instance.
	 */ _getData() {
        const editor = this._editor;
        const roots = editor.model.document.roots.filter((root)=>root.isAttached() && root.rootName != '$graveyard');
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
        roots.forEach((root)=>{
            data.roots[root.rootName] = {
                content: JSON.stringify(Array.from(root.getChildren())),
                attributes: JSON.stringify(Array.from(root.getAttributes())),
                isLoaded: root._isLoaded
            };
        });
        for (const marker of editor.model.markers){
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
            data.commentThreads = JSON.stringify(commentsRepository.getCommentThreads({
                toJSON: true,
                skipNotAttached: true
            }));
        }
        if (trackChanges) {
            data.suggestions = JSON.stringify(trackChanges.getSuggestions({
                toJSON: true,
                skipNotAttached: true
            }));
        }
        return data;
    }
    /**
	 * For each attached model root, returns its HTML editable element (if available).
	 */ _getEditables() {
        const editables = {};
        for (const rootName of this.editor.model.document.getRootNames()){
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
	 */ _isErrorComingFromThisItem(error) {
        return areConnectedThroughProperties(this._editor, error.context, this._excludedProps);
    }
    /**
	 * Clones the editor configuration.
	 */ _cloneEditorConfiguration(config) {
        return cloneDeepWith(config, (value, key)=>{
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
 */ class EditorWatchdogInitPlugin {
    editor;
    _data;
    constructor(editor){
        this.editor = editor;
        this._data = editor.config.get('_watchdogInitialData');
    }
    /**
	 * @inheritDoc
	 */ init() {
        // Stops the default editor initialization and use the saved data to restore the editor state.
        // Some of data could not be initialize as a config properties. It is important to keep the data
        // in the same form as it was before the restarting.
        this.editor.data.on('init', (evt)=>{
            evt.stop();
            this.editor.model.enqueueChange({
                isUndoable: false
            }, (writer)=>{
                this._restoreCollaborationData();
                this._restoreEditorData(writer);
            });
            this.editor.data.fire('ready');
        // Keep priority `'high' - 1` to be sure that RTC initialization will be first.
        }, {
            priority: 1000 - 1
        });
    }
    /**
	 * Creates a model node (element or text) based on provided JSON.
	 */ _createNode(writer, jsonNode) {
        if ('name' in jsonNode) {
            // If child has name property, it is an Element.
            const element = writer.createElement(jsonNode.name, jsonNode.attributes);
            if (jsonNode.children) {
                for (const child of jsonNode.children){
                    element._appendChild(this._createNode(writer, child));
                }
            }
            return element;
        } else {
            // Otherwise, it is a Text node.
            return writer.createText(jsonNode.data, jsonNode.attributes);
        }
    }
    /**
	 * Restores the editor by setting the document data, roots attributes and markers.
	 */ _restoreEditorData(writer) {
        const editor = this.editor;
        Object.entries(this._data.roots).forEach(([rootName, { content, attributes }])=>{
            const parsedNodes = JSON.parse(content);
            const parsedAttributes = JSON.parse(attributes);
            const rootElement = editor.model.document.getRoot(rootName);
            for (const [key, value] of parsedAttributes){
                writer.setAttribute(key, value, rootElement);
            }
            for (const child of parsedNodes){
                const node = this._createNode(writer, child);
                writer.insert(node, rootElement, 'end');
            }
        });
        Object.entries(this._data.markers).forEach(([markerName, markerOptions])=>{
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
	 */ _restoreCollaborationData() {
        // `as any` to avoid linking from external private repo.
        const parsedCommentThreads = JSON.parse(this._data.commentThreads);
        const parsedSuggestions = JSON.parse(this._data.suggestions);
        parsedCommentThreads.forEach((commentThreadData)=>{
            const channelId = this.editor.config.get('collaboration.channelId');
            const commentsRepository = this.editor.plugins.get('CommentsRepository');
            if (commentsRepository.hasCommentThread(commentThreadData.threadId)) {
                const commentThread = commentsRepository.getCommentThread(commentThreadData.threadId);
                commentThread.remove();
            }
            commentsRepository.addCommentThread({
                channelId,
                ...commentThreadData
            });
        });
        parsedSuggestions.forEach((suggestionData)=>{
            const trackChangesEditing = this.editor.plugins.get('TrackChangesEditing');
            if (trackChangesEditing.hasSuggestion(suggestionData.id)) {
                const suggestion = trackChangesEditing.getSuggestion(suggestionData.id);
                suggestion.attributes = suggestionData.attributes;
            } else {
                trackChangesEditing.addSuggestionData(suggestionData);
            }
        });
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module watchdog/contextwatchdog
 */ /* globals console */ // eslint-disable-next-line ckeditor5-rules/no-cross-package-imports
const mainQueueId = Symbol('MainQueueId');
/**
 * A watchdog for the {@link module:core/context~Context} class.
 *
 * See the {@glink features/watchdog Watchdog feature guide} to learn the rationale behind it and
 * how to use it.
 */ class ContextWatchdog extends Watchdog {
    /**
	 * A map of internal watchdogs for added items.
	 */ _watchdogs = new Map();
    /**
	 * The watchdog configuration.
	 */ _watchdogConfig;
    /**
	 * The current context instance.
	 */ _context = null;
    /**
	 * Context properties (nodes/references) that are gathered during the initial context creation
	 * and are used to distinguish the origin of an error.
	 */ _contextProps = new Set();
    /**
	 * An action queue, which is used to handle async functions queuing.
	 */ _actionQueues = new ActionQueues();
    /**
	 * The configuration for the {@link module:core/context~Context}.
	 */ _contextConfig;
    /**
	 * The watched item.
	 */ _item;
    /**
	 * The context watchdog class constructor.
	 *
	 * ```ts
	 * const watchdog = new ContextWatchdog( Context );
	 *
	 * await watchdog.create( contextConfiguration );
	 *
	 * await watchdog.add( item );
	 * ```
	 *
	 * See the {@glink features/watchdog Watchdog feature guide} to learn more how to use this feature.
	 *
	 * @param Context The {@link module:core/context~Context} class.
	 * @param watchdogConfig The watchdog configuration.
	 */ constructor(Context, watchdogConfig = {}){
        super(watchdogConfig);
        this._watchdogConfig = watchdogConfig;
        // Default creator and destructor.
        this._creator = (contextConfig)=>Context.create(contextConfig);
        this._destructor = (context)=>context.destroy();
        this._actionQueues.onEmpty(()=>{
            if (this.state === 'initializing') {
                this.state = 'ready';
                this._fire('stateChange');
            }
        });
    }
    /**
	 * Sets the function that is responsible for the context creation.
	 * It expects a function that should return a promise (or `undefined`).
	 *
	 * ```ts
	 * watchdog.setCreator( config => Context.create( config ) );
	 * ```
	 */ setCreator(creator) {
        this._creator = creator;
    }
    /**
	 * Sets the function that is responsible for the context destruction.
	 * Overrides the default destruction function, which destroys only the context instance.
	 * It expects a function that should return a promise (or `undefined`).
	 *
	 * ```ts
	 * watchdog.setDestructor( context => {
	 * 	// Do something before the context is destroyed.
	 *
	 * 	return context
	 * 		.destroy()
	 * 		.then( () => {
	 * 			// Do something after the context is destroyed.
	 * 		} );
	 * } );
	 * ```
	 */ setDestructor(destructor) {
        this._destructor = destructor;
    }
    /**
	 * The context instance. Keep in mind that this property might be changed when the context watchdog restarts,
	 * so do not keep this instance internally. Always operate on the `ContextWatchdog#context` property.
	 */ get context() {
        return this._context;
    }
    /**
	 * Initializes the context watchdog. Once it is created, the watchdog takes care about
	 * recreating the context and the provided items, and starts the error handling mechanism.
	 *
	 * ```ts
	 * await watchdog.create( {
	 * 	plugins: []
	 * } );
	 * ```
	 *
	 * @param contextConfig The context configuration. See {@link module:core/context~Context}.
	 */ create(contextConfig = {}) {
        return this._actionQueues.enqueue(mainQueueId, ()=>{
            this._contextConfig = contextConfig;
            return this._create();
        });
    }
    /**
	 * Returns an item instance with the given `itemId`.
	 *
	 * ```ts
	 * const editor1 = watchdog.getItem( 'editor1' );
	 * ```
	 *
	 * @param itemId The item ID.
	 * @returns The item instance or `undefined` if an item with a given ID has not been found.
	 */ getItem(itemId) {
        const watchdog = this._getWatchdog(itemId);
        return watchdog._item;
    }
    /**
	 * Gets the state of the given item. See {@link #state} for a list of available states.
	 *
	 * ```ts
	 * const editor1State = watchdog.getItemState( 'editor1' );
	 * ```
	 *
	 * @param itemId Item ID.
	 * @returns The state of the item.
	 */ getItemState(itemId) {
        const watchdog = this._getWatchdog(itemId);
        return watchdog.state;
    }
    /**
	 * Adds items to the watchdog. Once created, instances of these items will be available using the {@link #getItem} method.
	 *
	 * Items can be passed together as an array of objects:
	 *
	 * ```ts
	 * await watchdog.add( [ {
	 * 	id: 'editor1',
	 * 	type: 'editor',
	 * 	sourceElementOrData: document.querySelector( '#editor' ),
	 * 	config: {
	 * 		plugins: [ Essentials, Paragraph, Bold, Italic ],
	 * 		toolbar: [ 'bold', 'italic', 'alignment' ]
	 * 	},
	 * 	creator: ( element, config ) => ClassicEditor.create( element, config )
	 * } ] );
	 * ```
	 *
	 * Or one by one as objects:
	 *
	 * ```ts
	 * await watchdog.add( {
	 * 	id: 'editor1',
	 * 	type: 'editor',
	 * 	sourceElementOrData: document.querySelector( '#editor' ),
	 * 	config: {
	 * 		plugins: [ Essentials, Paragraph, Bold, Italic ],
	 * 		toolbar: [ 'bold', 'italic', 'alignment' ]
	 * 	},
	 * 	creator: ( element, config ) => ClassicEditor.create( element, config )
	 * ] );
	 * ```
	 *
	 * Then an instance can be retrieved using the {@link #getItem} method:
	 *
	 * ```ts
	 * const editor1 = watchdog.getItem( 'editor1' );
	 * ```
	 *
	 * Note that this method can be called multiple times, but for performance reasons it is better
	 * to pass all items together.
	 *
	 * @param itemConfigurationOrItemConfigurations An item configuration object or an array of item configurations.
	 */ add(itemConfigurationOrItemConfigurations) {
        const itemConfigurations = toArray(itemConfigurationOrItemConfigurations);
        return Promise.all(itemConfigurations.map((item)=>{
            return this._actionQueues.enqueue(item.id, ()=>{
                if (this.state === 'destroyed') {
                    throw new Error('Cannot add items to destroyed watchdog.');
                }
                if (!this._context) {
                    throw new Error('Context was not created yet. You should call the `ContextWatchdog#create()` method first.');
                }
                let watchdog;
                if (this._watchdogs.has(item.id)) {
                    throw new Error(`Item with the given id is already added: '${item.id}'.`);
                }
                if (item.type === 'editor') {
                    watchdog = new EditorWatchdog(null, this._watchdogConfig);
                    watchdog.setCreator(item.creator);
                    watchdog._setExcludedProperties(this._contextProps);
                    if (item.destructor) {
                        watchdog.setDestructor(item.destructor);
                    }
                    this._watchdogs.set(item.id, watchdog);
                    // Enqueue the internal watchdog errors within the main queue.
                    // And propagate the internal `error` events as `itemError` event.
                    watchdog.on('error', (evt, { error, causesRestart })=>{
                        this._fire('itemError', {
                            itemId: item.id,
                            error
                        });
                        // Do not enqueue the item restart action if the item will not restart.
                        if (!causesRestart) {
                            return;
                        }
                        this._actionQueues.enqueue(item.id, ()=>new Promise((res)=>{
                                const rethrowRestartEventOnce = ()=>{
                                    watchdog.off('restart', rethrowRestartEventOnce);
                                    this._fire('itemRestart', {
                                        itemId: item.id
                                    });
                                    res();
                                };
                                watchdog.on('restart', rethrowRestartEventOnce);
                            }));
                    });
                    return watchdog.create(item.sourceElementOrData, item.config, this._context);
                } else {
                    throw new Error(`Not supported item type: '${item.type}'.`);
                }
            });
        }));
    }
    /**
	 * Removes and destroys item(s) with given ID(s).
	 *
	 * ```ts
	 * await watchdog.remove( 'editor1' );
	 * ```
	 *
	 * Or
	 *
	 * ```ts
	 * await watchdog.remove( [ 'editor1', 'editor2' ] );
	 * ```
	 *
	 * @param itemIdOrItemIds Item ID or an array of item IDs.
	 */ remove(itemIdOrItemIds) {
        const itemIds = toArray(itemIdOrItemIds);
        return Promise.all(itemIds.map((itemId)=>{
            return this._actionQueues.enqueue(itemId, ()=>{
                const watchdog = this._getWatchdog(itemId);
                this._watchdogs.delete(itemId);
                return watchdog.destroy();
            });
        }));
    }
    /**
	 * Destroys the context watchdog and all added items.
	 * Once the context watchdog is destroyed, new items cannot be added.
	 *
	 * ```ts
	 * await watchdog.destroy();
	 * ```
	 */ destroy() {
        return this._actionQueues.enqueue(mainQueueId, ()=>{
            this.state = 'destroyed';
            this._fire('stateChange');
            super.destroy();
            return this._destroy();
        });
    }
    /**
	 * Restarts the context watchdog.
	 */ _restart() {
        return this._actionQueues.enqueue(mainQueueId, ()=>{
            this.state = 'initializing';
            this._fire('stateChange');
            return this._destroy().catch((err)=>{
                console.error('An error happened during destroying the context or items.', err);
            }).then(()=>this._create()).then(()=>this._fire('restart'));
        });
    }
    /**
	 * Initializes the context watchdog.
	 */ _create() {
        return Promise.resolve().then(()=>{
            this._startErrorHandling();
            return this._creator(this._contextConfig);
        }).then((context)=>{
            this._context = context;
            this._contextProps = getSubNodes(this._context);
            return Promise.all(Array.from(this._watchdogs.values()).map((watchdog)=>{
                watchdog._setExcludedProperties(this._contextProps);
                return watchdog.create(undefined, undefined, this._context);
            }));
        });
    }
    /**
	 * Destroys the context instance and all added items.
	 */ _destroy() {
        return Promise.resolve().then(()=>{
            this._stopErrorHandling();
            const context = this._context;
            this._context = null;
            this._contextProps = new Set();
            return Promise.all(Array.from(this._watchdogs.values()).map((watchdog)=>watchdog.destroy()))// Context destructor destroys each editor.
            .then(()=>this._destructor(context));
        });
    }
    /**
	 * Returns the watchdog for a given item ID.
	 *
	 * @param itemId Item ID.
	 */ _getWatchdog(itemId) {
        const watchdog = this._watchdogs.get(itemId);
        if (!watchdog) {
            throw new Error(`Item with the given id was not registered: ${itemId}.`);
        }
        return watchdog;
    }
    /**
	 * Checks whether an error comes from the context instance and not from the item instances.
	 *
	 * @internal
	 */ _isErrorComingFromThisItem(error) {
        for (const watchdog of this._watchdogs.values()){
            if (watchdog._isErrorComingFromThisItem(error)) {
                return false;
            }
        }
        return areConnectedThroughProperties(this._context, error.context);
    }
}
/**
 * Manager of action queues that allows queuing async functions.
 */ class ActionQueues {
    _onEmptyCallbacks = [];
    _queues = new Map();
    _activeActions = 0;
    /**
	 * Used to register callbacks that will be run when the queue becomes empty.
	 *
	 * @param onEmptyCallback A callback that will be run whenever the queue becomes empty.
	 */ onEmpty(onEmptyCallback) {
        this._onEmptyCallbacks.push(onEmptyCallback);
    }
    /**
	 * It adds asynchronous actions (functions) to the proper queue and runs them one by one.
	 *
	 * @param queueId The action queue ID.
	 * @param action A function that should be enqueued.
	 */ enqueue(queueId, action) {
        const isMainAction = queueId === mainQueueId;
        this._activeActions++;
        if (!this._queues.get(queueId)) {
            this._queues.set(queueId, Promise.resolve());
        }
        // List all sources of actions that the current action needs to await for.
        // For the main action wait for all other actions.
        // For the item action wait only for the item queue and the main queue.
        const awaitedActions = isMainAction ? Promise.all(this._queues.values()) : Promise.all([
            this._queues.get(mainQueueId),
            this._queues.get(queueId)
        ]);
        const queueWithAction = awaitedActions.then(action);
        // Catch all errors in the main queue to stack promises even if an error occurred in the past.
        const nonErrorQueue = queueWithAction.catch(()=>{});
        this._queues.set(queueId, nonErrorQueue);
        return queueWithAction.finally(()=>{
            this._activeActions--;
            if (this._queues.get(queueId) === nonErrorQueue && this._activeActions === 0) {
                this._onEmptyCallbacks.forEach((cb)=>cb());
            }
        });
    }
}
/**
 * Transforms any value to an array. If the provided value is already an array, it is returned unchanged.
 *
 * @param elementOrArray The value to transform to an array.
 * @returns An array created from data.
 */ function toArray(elementOrArray) {
    return Array.isArray(elementOrArray) ? elementOrArray : [
        elementOrArray
    ];
}

export { ContextWatchdog, EditorWatchdog, Watchdog };
//# sourceMappingURL=index.js.map
