/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/editorui/editorui
 */
/* globals console */
import ComponentFactory from '../componentfactory.js';
import TooltipManager from '../tooltipmanager.js';
import PoweredBy from './poweredby.js';
import AriaLiveAnnouncer from '../arialiveannouncer.js';
import { ObservableMixin, isVisible, FocusTracker } from '@ckeditor/ckeditor5-utils';
/**
 * A class providing the minimal interface that is required to successfully bootstrap any editor UI.
 */
export default class EditorUI extends /* #__PURE__ */ ObservableMixin() {
    /**
     * Creates an instance of the editor UI class.
     *
     * @param editor The editor instance.
     */
    constructor(editor) {
        super();
        /**
         * Indicates the UI is ready. Set `true` after {@link #event:ready} event is fired.
         *
         * @readonly
         * @default false
         */
        this.isReady = false;
        /**
         * Stores all editable elements used by the editor instance.
         */
        this._editableElementsMap = new Map();
        /**
         * All available & focusable toolbars.
         */
        this._focusableToolbarDefinitions = [];
        const editingView = editor.editing.view;
        this.editor = editor;
        this.componentFactory = new ComponentFactory(editor);
        this.focusTracker = new FocusTracker();
        this.tooltipManager = new TooltipManager(editor);
        this.poweredBy = new PoweredBy(editor);
        this.ariaLiveAnnouncer = new AriaLiveAnnouncer(editor);
        this.set('viewportOffset', this._readViewportOffsetFromConfig());
        this.once('ready', () => {
            this.isReady = true;
        });
        // Informs UI components that should be refreshed after layout change.
        this.listenTo(editingView.document, 'layoutChanged', this.update.bind(this));
        this.listenTo(editingView, 'scrollToTheSelection', this._handleScrollToTheSelection.bind(this));
        this._initFocusTracking();
    }
    /**
     * The main (outermost) DOM element of the editor UI.
     *
     * For example, in {@link module:editor-classic/classiceditor~ClassicEditor} it is a `<div>` which
     * wraps the editable element and the toolbar. In {@link module:editor-inline/inlineeditor~InlineEditor}
     * it is the editable element itself (as there is no other wrapper). However, in
     * {@link module:editor-decoupled/decouplededitor~DecoupledEditor} it is set to `null` because this editor does not
     * come with a single "main" HTML element (its editable element and toolbar are separate).
     *
     * This property can be understood as a shorthand for retrieving the element that a specific editor integration
     * considers to be its main DOM element.
     */
    get element() {
        return null;
    }
    /**
     * Fires the {@link module:ui/editorui/editorui~EditorUI#event:update `update`} event.
     *
     * This method should be called when the editor UI (e.g. positions of its balloons) needs to be updated due to
     * some environmental change which CKEditor 5 is not aware of (e.g. resize of a container in which it is used).
     */
    update() {
        this.fire('update');
    }
    /**
     * Destroys the UI.
     */
    destroy() {
        this.stopListening();
        this.focusTracker.destroy();
        this.tooltipManager.destroy(this.editor);
        this.poweredBy.destroy();
        // Clean–up the references to the CKEditor instance stored in the native editable DOM elements.
        for (const domElement of this._editableElementsMap.values()) {
            domElement.ckeditorInstance = null;
            this.editor.keystrokes.stopListening(domElement);
        }
        this._editableElementsMap = new Map();
        this._focusableToolbarDefinitions = [];
    }
    /**
     * Stores the native DOM editable element used by the editor under a unique name.
     *
     * Also, registers the element in the editor to maintain the accessibility of the UI. When the user is editing text in a focusable
     * editable area, they can use the <kbd>Alt</kbd> + <kbd>F10</kbd> keystroke to navigate over editor toolbars. See {@link #addToolbar}.
     *
     * @param rootName The unique name of the editable element.
     * @param domElement The native DOM editable element.
     */
    setEditableElement(rootName, domElement) {
        this._editableElementsMap.set(rootName, domElement);
        // Put a reference to the CKEditor instance in the editable native DOM element.
        // It helps 3rd–party software (browser extensions, other libraries) access and recognize
        // CKEditor 5 instances (editing roots) and use their API (there is no global editor
        // instance registry).
        if (!domElement.ckeditorInstance) {
            domElement.ckeditorInstance = this.editor;
        }
        // Register the element, so it becomes available for Alt+F10 and Esc navigation.
        this.focusTracker.add(domElement);
        const setUpKeystrokeHandler = () => {
            // The editing view of the editor is already listening to keystrokes from DOM roots (see: KeyObserver).
            // Do not duplicate listeners.
            if (this.editor.editing.view.getDomRoot(rootName)) {
                return;
            }
            this.editor.keystrokes.listenTo(domElement);
        };
        // For editable elements set by features after EditorUI is ready (e.g. source editing).
        if (this.isReady) {
            setUpKeystrokeHandler();
        }
        // For editable elements set while the editor is being created (e.g. DOM roots).
        else {
            this.once('ready', setUpKeystrokeHandler);
        }
    }
    /**
     * Removes the editable from the editor UI. Removes all handlers added by {@link #setEditableElement}.
     *
     * @param rootName The name of the editable element to remove.
     */
    removeEditableElement(rootName) {
        const domElement = this._editableElementsMap.get(rootName);
        if (!domElement) {
            return;
        }
        this._editableElementsMap.delete(rootName);
        this.editor.keystrokes.stopListening(domElement);
        this.focusTracker.remove(domElement);
        domElement.ckeditorInstance = null;
    }
    /**
     * Returns the editable editor element with the given name or null if editable does not exist.
     *
     * @param rootName The editable name.
     */
    getEditableElement(rootName = 'main') {
        return this._editableElementsMap.get(rootName);
    }
    /**
     * Returns array of names of all editor editable elements.
     */
    getEditableElementsNames() {
        return this._editableElementsMap.keys();
    }
    /**
     * Adds a toolbar to the editor UI. Used primarily to maintain the accessibility of the UI.
     *
     * Focusable toolbars can be accessed (focused) by users by pressing the <kbd>Alt</kbd> + <kbd>F10</kbd> keystroke.
     * Successive keystroke presses navigate over available toolbars.
     *
     * @param toolbarView A instance of the toolbar to be registered.
     */
    addToolbar(toolbarView, options = {}) {
        if (toolbarView.isRendered) {
            this.focusTracker.add(toolbarView.element);
            this.editor.keystrokes.listenTo(toolbarView.element);
        }
        else {
            toolbarView.once('render', () => {
                this.focusTracker.add(toolbarView.element);
                this.editor.keystrokes.listenTo(toolbarView.element);
            });
        }
        this._focusableToolbarDefinitions.push({ toolbarView, options });
    }
    /**
     * Stores all editable elements used by the editor instance.
     *
     * @deprecated
     */
    get _editableElements() {
        /**
         * The {@link module:ui/editorui/editorui~EditorUI#_editableElements `EditorUI#_editableElements`} property has been
         * deprecated and will be removed in the near future. Please use
         * {@link module:ui/editorui/editorui~EditorUI#setEditableElement `setEditableElement()`} and
         * {@link module:ui/editorui/editorui~EditorUI#getEditableElement `getEditableElement()`} methods instead.
         *
         * @error editor-ui-deprecated-editable-elements
         * @param editorUI Editor UI instance the deprecated property belongs to.
         */
        console.warn('editor-ui-deprecated-editable-elements: ' +
            'The EditorUI#_editableElements property has been deprecated and will be removed in the near future.', { editorUI: this });
        return this._editableElementsMap;
    }
    /**
     * Returns viewport offsets object:
     *
     * ```js
     * {
     * 	top: Number,
     * 	right: Number,
     * 	bottom: Number,
     * 	left: Number
     * }
     * ```
     *
     * Only top property is currently supported.
     */
    _readViewportOffsetFromConfig() {
        const editor = this.editor;
        const viewportOffsetConfig = editor.config.get('ui.viewportOffset');
        if (viewportOffsetConfig) {
            return viewportOffsetConfig;
        }
        // Not present in EditorConfig type, because it's legacy. Hence the `as` expression.
        const legacyOffsetConfig = editor.config.get('toolbar.viewportTopOffset');
        // Fall back to deprecated toolbar config.
        if (legacyOffsetConfig) {
            /**
             * The {@link module:core/editor/editorconfig~EditorConfig#toolbar `EditorConfig#toolbar.viewportTopOffset`}
             * property has been deprecated and will be removed in the near future. Please use
             * {@link module:core/editor/editorconfig~EditorConfig#ui `EditorConfig#ui.viewportOffset`} instead.
             *
             * @error editor-ui-deprecated-viewport-offset-config
             */
            console.warn('editor-ui-deprecated-viewport-offset-config: ' +
                'The `toolbar.vieportTopOffset` configuration option is deprecated. ' +
                'It will be removed from future CKEditor versions. Use `ui.viewportOffset.top` instead.');
            return { top: legacyOffsetConfig };
        }
        // More keys to come in the future.
        return { top: 0 };
    }
    /**
     * Starts listening for <kbd>Alt</kbd> + <kbd>F10</kbd> and <kbd>Esc</kbd> keystrokes in the context of focusable
     * {@link #setEditableElement editable elements} and {@link #addToolbar toolbars}
     * to allow users navigate across the UI.
     */
    _initFocusTracking() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        let lastFocusedForeignElement;
        let candidateDefinitions;
        // Focus the next focusable toolbar on <kbd>Alt</kbd> + <kbd>F10</kbd>.
        editor.keystrokes.set('Alt+F10', (data, cancel) => {
            const focusedElement = this.focusTracker.focusedElement;
            // Focus moved out of a DOM element that
            // * is not a toolbar,
            // * does not belong to the editing view (e.g. source editing).
            if (Array.from(this._editableElementsMap.values()).includes(focusedElement) &&
                !Array.from(editingView.domRoots.values()).includes(focusedElement)) {
                lastFocusedForeignElement = focusedElement;
            }
            const currentFocusedToolbarDefinition = this._getCurrentFocusedToolbarDefinition();
            // * When focusing a toolbar for the first time, set the array of definitions for successive presses of Alt+F10.
            // This ensures, the navigation works always the same and no pair of toolbars takes over
            // (e.g. image and table toolbars when a selected image is inside a cell).
            // * It could be that the focus went to the toolbar by clicking a toolbar item (e.g. a dropdown). In this case,
            // there were no candidates so they must be obtained (#12339).
            if (!currentFocusedToolbarDefinition || !candidateDefinitions) {
                candidateDefinitions = this._getFocusableCandidateToolbarDefinitions();
            }
            // In a single Alt+F10 press, check all candidates but if none were focused, don't go any further.
            // This prevents an infinite loop.
            for (let i = 0; i < candidateDefinitions.length; i++) {
                const candidateDefinition = candidateDefinitions.shift();
                // Put the first definition to the back of the array. This allows circular navigation over all toolbars
                // on successive presses of Alt+F10.
                candidateDefinitions.push(candidateDefinition);
                // Don't focus the same toolbar again. If you did, this would move focus from the nth focused toolbar item back to the
                // first item as per ToolbarView#focus() if the user navigated inside the toolbar.
                if (candidateDefinition !== currentFocusedToolbarDefinition &&
                    this._focusFocusableCandidateToolbar(candidateDefinition)) {
                    // Clean up after a current visible toolbar when switching to the next one.
                    if (currentFocusedToolbarDefinition && currentFocusedToolbarDefinition.options.afterBlur) {
                        currentFocusedToolbarDefinition.options.afterBlur();
                    }
                    break;
                }
            }
            cancel();
        });
        // Blur the focused toolbar on <kbd>Esc</kbd> and bring the focus back to its origin.
        editor.keystrokes.set('Esc', (data, cancel) => {
            const focusedToolbarDef = this._getCurrentFocusedToolbarDefinition();
            if (!focusedToolbarDef) {
                return;
            }
            // Bring focus back to where it came from before focusing the toolbar:
            // 1. If it came from outside the engine view (e.g. source editing), move it there.
            if (lastFocusedForeignElement) {
                lastFocusedForeignElement.focus();
                lastFocusedForeignElement = null;
            }
            // 2. There are two possibilities left:
            //   2.1. It could be that the focus went from an editable element in the view (root or nested).
            //   2.2. It could be the focus went straight to the toolbar before even focusing the editing area.
            // In either case, just focus the view editing. The focus will land where it belongs.
            else {
                editor.editing.view.focus();
            }
            // Clean up after the toolbar if there is anything to do there.
            if (focusedToolbarDef.options.afterBlur) {
                focusedToolbarDef.options.afterBlur();
            }
            cancel();
        });
    }
    /**
     * Returns definitions of toolbars that could potentially be focused, sorted by their importance for the user.
     *
     * Focusable toolbars candidates are either:
     * * already visible,
     * * have `beforeFocus()` set in their {@link module:ui/editorui/editorui~FocusableToolbarDefinition definition} that suggests that
     * they might show up when called. Keep in mind that determining whether a toolbar will show up (and become focusable) is impossible
     * at this stage because it depends on its implementation, that in turn depends on the editing context (selection).
     *
     * **Note**: Contextual toolbars take precedence over regular toolbars.
     */
    _getFocusableCandidateToolbarDefinitions() {
        const definitions = [];
        for (const toolbarDef of this._focusableToolbarDefinitions) {
            const { toolbarView, options } = toolbarDef;
            if (isVisible(toolbarView.element) || options.beforeFocus) {
                definitions.push(toolbarDef);
            }
        }
        // Contextual and already visible toolbars have higher priority. If both are true, the toolbar will always focus first.
        // For instance, a selected widget toolbar vs inline editor toolbar: both are visible but the widget toolbar is contextual.
        definitions.sort((defA, defB) => getToolbarDefinitionWeight(defA) - getToolbarDefinitionWeight(defB));
        return definitions;
    }
    /**
     * Returns a definition of the toolbar that is currently visible and focused (one of its children has focus).
     *
     * `null` is returned when no toolbar is currently focused.
     */
    _getCurrentFocusedToolbarDefinition() {
        for (const definition of this._focusableToolbarDefinitions) {
            if (definition.toolbarView.element && definition.toolbarView.element.contains(this.focusTracker.focusedElement)) {
                return definition;
            }
        }
        return null;
    }
    /**
     * Focuses a focusable toolbar candidate using its definition.
     *
     * @param candidateToolbarDefinition A definition of the toolbar to focus.
     * @returns `true` when the toolbar candidate was focused. `false` otherwise.
     */
    _focusFocusableCandidateToolbar(candidateToolbarDefinition) {
        const { toolbarView, options: { beforeFocus } } = candidateToolbarDefinition;
        if (beforeFocus) {
            beforeFocus();
        }
        // If it didn't show up after beforeFocus(), it's not focusable at all.
        if (!isVisible(toolbarView.element)) {
            return false;
        }
        toolbarView.focus();
        return true;
    }
    /**
     * Provides an integration between {@link #viewportOffset} and {@link module:utils/dom/scroll~scrollViewportToShowTarget}.
     * It allows the UI-agnostic engine method to consider user-configured viewport offsets specific for the integration.
     *
     * @param evt The `scrollToTheSelection` event info.
     * @param data The payload carried by the `scrollToTheSelection` event.
     */
    _handleScrollToTheSelection(evt, data) {
        const configuredViewportOffset = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            ...this.viewportOffset
        };
        data.viewportOffset.top += configuredViewportOffset.top;
        data.viewportOffset.bottom += configuredViewportOffset.bottom;
        data.viewportOffset.left += configuredViewportOffset.left;
        data.viewportOffset.right += configuredViewportOffset.right;
    }
}
/**
 * Returns a number (weight) for a toolbar definition. Visible toolbars have a higher priority and so do
 * contextual toolbars (displayed in the context of a content, for instance, an image toolbar).
 *
 * A standard invisible toolbar is the heaviest. A visible contextual toolbar is the lightest.
 *
 * @param toolbarDef A toolbar definition to be weighted.
 */
function getToolbarDefinitionWeight(toolbarDef) {
    const { toolbarView, options } = toolbarDef;
    let weight = 10;
    // Prioritize already visible toolbars. They should get focused first.
    if (isVisible(toolbarView.element)) {
        weight--;
    }
    // Prioritize contextual toolbars. They are displayed at the selection.
    if (options.isContextual) {
        weight--;
    }
    return weight;
}
