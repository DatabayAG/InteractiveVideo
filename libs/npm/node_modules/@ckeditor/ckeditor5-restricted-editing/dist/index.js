/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import { Matcher } from '@ckeditor/ckeditor5-engine/dist/index.js';
import { createDropdown, addListToDropdown, MenuBarMenuView, MenuBarMenuListView, MenuBarMenuListItemView, MenuBarMenuListItemButtonView, ViewModel, ButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import { Collection } from '@ckeditor/ckeditor5-utils/dist/index.js';

/**
 * The command that allows navigation across the exceptions in the edited document.
 */ class RestrictedEditingModeNavigationCommand extends Command {
    /**
	 * The direction of the command.
	 */ _direction;
    /**
	 * Creates an instance of the command.
	 *
	 * @param editor The editor instance.
	 * @param direction The direction that the command works.
	 */ constructor(editor, direction){
        super(editor);
        // It does not affect data so should be enabled in read-only mode and in restricted editing mode.
        this.affectsData = false;
        this._direction = direction;
    }
    /**
	 * @inheritDoc
	 */ refresh() {
        this.isEnabled = this._checkEnabled();
    }
    /**
	 * Executes the command.
	 *
	 * @fires execute
	 */ execute() {
        const position = getNearestExceptionRange(this.editor.model, this._direction);
        if (!position) {
            return;
        }
        this.editor.model.change((writer)=>{
            writer.setSelection(position);
        });
    }
    /**
	 * Checks whether the command can be enabled in the current context.
	 *
	 * @returns Whether the command should be enabled.
	 */ _checkEnabled() {
        return !!getNearestExceptionRange(this.editor.model, this._direction);
    }
}
/**
 * Returns the range of the exception marker closest to the last position of the model selection.
 */ function getNearestExceptionRange(model, direction) {
    const selection = model.document.selection;
    const selectionPosition = selection.getFirstPosition();
    const markerRanges = [];
    // Get all exception marker positions that start after/before the selection position.
    for (const marker of model.markers.getMarkersGroup('restrictedEditingException')){
        const markerRange = marker.getRange();
        // Checking parent because there two positions <paragraph>foo^</paragraph><paragraph>^bar</paragraph>
        // are touching but they will represent different markers.
        const isMarkerRangeTouching = selectionPosition.isTouching(markerRange.start) && selectionPosition.hasSameParentAs(markerRange.start) || selectionPosition.isTouching(markerRange.end) && selectionPosition.hasSameParentAs(markerRange.end);
        // <paragraph>foo <marker≥b[]ar</marker> baz</paragraph>
        // <paragraph>foo <marker≥b[ar</marker> ba]z</paragraph>
        // <paragraph>foo <marker≥bar</marker>[] baz</paragraph>
        // <paragraph>foo []<marker≥bar</marker> baz</paragraph>
        if (markerRange.containsPosition(selectionPosition) || isMarkerRangeTouching) {
            continue;
        }
        if (direction === 'forward' && markerRange.start.isAfter(selectionPosition)) {
            markerRanges.push(markerRange);
        } else if (direction === 'backward' && markerRange.end.isBefore(selectionPosition)) {
            markerRanges.push(markerRange);
        }
    }
    if (!markerRanges.length) {
        return;
    }
    // Get the marker closest to the selection position among many. To know that, we need to sort
    // them first.
    return markerRanges.sort((rangeA, rangeB)=>{
        if (direction === 'forward') {
            return rangeA.start.isAfter(rangeB.start) ? 1 : -1;
        } else {
            return rangeA.start.isBefore(rangeB.start) ? 1 : -1;
        }
    }).shift();
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module restricted-editing/restrictededitingmode/utils
 */ /**
 * Returns a single "restricted-editing-exception" marker at a given position. Contrary to
 * {@link module:engine/model/markercollection~MarkerCollection#getMarkersAtPosition}, it returnd a marker also when the postion is
 * equal to one of the marker's start or end positions.
 */ function getMarkerAtPosition(editor, position) {
    for (const marker of editor.model.markers){
        const markerRange = marker.getRange();
        if (isPositionInRangeBoundaries(markerRange, position)) {
            if (marker.name.startsWith('restrictedEditingException:')) {
                return marker;
            }
        }
    }
}
/**
 * Checks if the position is fully contained in the range. Positions equal to range start or end are considered "in".
 */ function isPositionInRangeBoundaries(range, position) {
    return range.containsPosition(position) || range.end.isEqual(position) || range.start.isEqual(position);
}
/**
 * Checks if the selection is fully contained in the marker. Positions on marker boundaries are considered "in".
 *
 * ```xml
 * <marker>[]foo</marker> -> true
 * <marker>f[oo]</marker> -> true
 * <marker>f[oo</marker> ba]r -> false
 * <marker>foo</marker> []bar -> false
 * ```
 */ function isSelectionInMarker(selection, marker) {
    if (!marker) {
        return false;
    }
    const markerRange = marker.getRange();
    if (selection.isCollapsed) {
        return isPositionInRangeBoundaries(markerRange, selection.focus);
    }
    return markerRange.containsRange(selection.getFirstRange(), true);
}

const HIGHLIGHT_CLASS = 'restricted-editing-exception_selected';
/**
 * Adds a visual highlight style to a restricted editing exception that the selection is anchored to.
 *
 * The highlight is turned on by adding the `.restricted-editing-exception_selected` class to the
 * exception in the view:
 *
 * * The class is removed before the conversion starts, as callbacks added with the `'highest'` priority
 * to {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher} events.
 * * The class is added in the view post-fixer, after other changes in the model tree are converted to the view.
 *
 * This way, adding and removing the highlight does not interfere with conversion.
 */ function setupExceptionHighlighting(editor) {
    const view = editor.editing.view;
    const model = editor.model;
    const highlightedMarkers = new Set();
    // Adding the class.
    view.document.registerPostFixer((writer)=>{
        const modelSelection = model.document.selection;
        const marker = getMarkerAtPosition(editor, modelSelection.anchor);
        if (!marker) {
            return false;
        }
        for (const viewElement of editor.editing.mapper.markerNameToElements(marker.name)){
            writer.addClass(HIGHLIGHT_CLASS, viewElement);
            highlightedMarkers.add(viewElement);
        }
        return false;
    });
    // Removing the class.
    editor.conversion.for('editingDowncast').add((dispatcher)=>{
        // Make sure the highlight is removed on every possible event, before conversion is started.
        dispatcher.on('insert', removeHighlight, {
            priority: 'highest'
        });
        dispatcher.on('remove', removeHighlight, {
            priority: 'highest'
        });
        dispatcher.on('attribute', removeHighlight, {
            priority: 'highest'
        });
        dispatcher.on('cleanSelection', removeHighlight);
        function removeHighlight() {
            view.change((writer)=>{
                for (const item of highlightedMarkers.values()){
                    writer.removeClass(HIGHLIGHT_CLASS, item);
                    highlightedMarkers.delete(item);
                }
            });
        }
    });
}
/**
 * A post-fixer that prevents removing a collapsed marker from the document.
 */ function resurrectCollapsedMarkerPostFixer(editor) {
    // This post-fixer shouldn't be necessary after https://github.com/ckeditor/ckeditor5/issues/5778.
    return (writer)=>{
        let changeApplied = false;
        for (const { name, data } of editor.model.document.differ.getChangedMarkers()){
            if (name.startsWith('restrictedEditingException') && data.newRange && data.newRange.root.rootName == '$graveyard') {
                writer.updateMarker(name, {
                    range: writer.createRange(writer.createPositionAt(data.oldRange.start))
                });
                changeApplied = true;
            }
        }
        return changeApplied;
    };
}
/**
 * A post-fixer that extends a marker when the user types on its boundaries.
 */ function extendMarkerOnTypingPostFixer(editor) {
    // This post-fixer shouldn't be necessary after https://github.com/ckeditor/ckeditor5/issues/5778.
    return (writer)=>{
        let changeApplied = false;
        const schema = editor.model.schema;
        for (const change of editor.model.document.differ.getChanges()){
            if (change.type == 'insert' && schema.checkChild('$block', change.name)) {
                changeApplied = _tryExtendMarkerStart(editor, change.position, change.length, writer) || changeApplied;
                changeApplied = _tryExtendMarkedEnd(editor, change.position, change.length, writer) || changeApplied;
            }
        }
        return changeApplied;
    };
}
/**
 * A view highlight-to-marker conversion helper.
 *
 * @param config Conversion configuration.
 */ function upcastHighlightToMarker(config) {
    return (dispatcher)=>dispatcher.on('element:span', (evt, data, conversionApi)=>{
            const { writer } = conversionApi;
            const matcher = new Matcher(config.view);
            const matcherResult = matcher.match(data.viewItem);
            // If there is no match, this callback should not do anything.
            if (!matcherResult) {
                return;
            }
            const match = matcherResult.match;
            // Force consuming element's name (taken from upcast helpers elementToElement converter).
            match.name = true;
            const { modelRange: convertedChildrenRange } = conversionApi.convertChildren(data.viewItem, data.modelCursor);
            conversionApi.consumable.consume(data.viewItem, match);
            const markerName = config.model();
            const fakeMarkerStart = writer.createElement('$marker', {
                'data-name': markerName
            });
            const fakeMarkerEnd = writer.createElement('$marker', {
                'data-name': markerName
            });
            // Insert in reverse order to use converter content positions directly (without recalculating).
            writer.insert(fakeMarkerEnd, convertedChildrenRange.end);
            writer.insert(fakeMarkerStart, convertedChildrenRange.start);
            data.modelRange = writer.createRange(writer.createPositionBefore(fakeMarkerStart), writer.createPositionAfter(fakeMarkerEnd));
            data.modelCursor = data.modelRange.end;
        });
}
/**
 * Extend marker if change detected on marker's start position.
 */ function _tryExtendMarkerStart(editor, position, length, writer) {
    const markerAtStart = getMarkerAtPosition(editor, position.getShiftedBy(length));
    if (markerAtStart && markerAtStart.getStart().isEqual(position.getShiftedBy(length))) {
        writer.updateMarker(markerAtStart, {
            range: writer.createRange(markerAtStart.getStart().getShiftedBy(-length), markerAtStart.getEnd())
        });
        return true;
    }
    return false;
}
/**
 * Extend marker if change detected on marker's end position.
 */ function _tryExtendMarkedEnd(editor, position, length, writer) {
    const markerAtEnd = getMarkerAtPosition(editor, position);
    if (markerAtEnd && markerAtEnd.getEnd().isEqual(position)) {
        writer.updateMarker(markerAtEnd, {
            range: writer.createRange(markerAtEnd.getStart(), markerAtEnd.getEnd().getShiftedBy(length))
        });
        return true;
    }
    return false;
}

const COMMAND_FORCE_DISABLE_ID = 'RestrictedEditingMode';
/**
 * The restricted editing mode editing feature.
 *
 * * It introduces the exception marker group that renders to `<span>` elements with the `restricted-editing-exception` CSS class.
 * * It registers the `'goToPreviousRestrictedEditingException'` and `'goToNextRestrictedEditingException'` commands.
 * * It also enables highlighting exception markers that are selected.
 */ class RestrictedEditingModeEditing extends Plugin {
    /**
	 * Command names that are enabled outside the non-restricted regions.
	 */ _alwaysEnabled;
    /**
	 * Commands allowed in non-restricted areas.
	 *
	 * Commands always enabled combine typing feature commands: `'input'`, `'insertText'`, `'delete'`, and `'deleteForward'` with
	 * commands defined in the feature configuration.
	 */ _allowedInException;
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RestrictedEditingModeEditing';
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        editor.config.define('restrictedEditing', {
            allowedCommands: [
                'bold',
                'italic',
                'link',
                'unlink'
            ],
            allowedAttributes: [
                'bold',
                'italic',
                'linkHref'
            ]
        });
        this._alwaysEnabled = new Set([
            'undo',
            'redo'
        ]);
        this._allowedInException = new Set([
            'input',
            'insertText',
            'delete',
            'deleteForward'
        ]);
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const editingView = editor.editing.view;
        const allowedCommands = editor.config.get('restrictedEditing.allowedCommands');
        allowedCommands.forEach((commandName)=>this._allowedInException.add(commandName));
        this._setupConversion();
        this._setupCommandsToggling();
        this._setupRestrictions();
        // Commands & keystrokes that allow navigation in the content.
        editor.commands.add('goToPreviousRestrictedEditingException', new RestrictedEditingModeNavigationCommand(editor, 'backward'));
        editor.commands.add('goToNextRestrictedEditingException', new RestrictedEditingModeNavigationCommand(editor, 'forward'));
        this.listenTo(editingView.document, 'tab', (evt, data)=>{
            const commandName = !data.shiftKey ? 'goToNextRestrictedEditingException' : 'goToPreviousRestrictedEditingException';
            const command = editor.commands.get(commandName);
            if (command.isEnabled) {
                editor.execute(commandName);
                // Stop the event in the DOM: no listener in the web page will be triggered by this event.
                data.preventDefault();
                data.stopPropagation();
            }
            // Stop the event bubbling in the editor: no more callbacks will be executed for this keystroke.
            evt.stop();
        }, {
            context: '$capture'
        });
        editor.keystrokes.set('Ctrl+A', getSelectAllHandler(editor));
        editingView.change((writer)=>{
            for (const root of editingView.document.roots){
                writer.addClass('ck-restricted-editing_mode_restricted', root);
            }
        });
    }
    /**
	 * Makes the given command always enabled in the restricted editing mode (regardless
	 * of selection location).
	 *
	 * To enable some commands in non-restricted areas of the content use
	 * {@link module:restricted-editing/restrictededitingconfig~RestrictedEditingConfig#allowedCommands} configuration option.
	 *
	 * @param commandName Name of the command to enable.
	 */ enableCommand(commandName) {
        const command = this.editor.commands.get(commandName);
        command.clearForceDisabled(COMMAND_FORCE_DISABLE_ID);
        this._alwaysEnabled.add(commandName);
    }
    /**
	 * Sets up the restricted mode editing conversion:
	 *
	 * * ucpast & downcast converters,
	 * * marker highlighting in the edting area,
	 * * marker post-fixers.
	 */ _setupConversion() {
        const editor = this.editor;
        const model = editor.model;
        const doc = model.document;
        // The restricted editing does not attach additional data to the zones so there's no need for smarter markers managing.
        // Also, the markers will only be created when loading the data.
        let markerNumber = 0;
        editor.conversion.for('upcast').add(upcastHighlightToMarker({
            view: {
                name: 'span',
                classes: 'restricted-editing-exception'
            },
            model: ()=>{
                markerNumber++; // Starting from restrictedEditingException:1 marker.
                return `restrictedEditingException:${markerNumber}`;
            }
        }));
        // Currently the marker helpers are tied to other use-cases and do not render a collapsed marker as highlight.
        // Also, markerToHighlight can not convert marker on an inline object. It handles only text and widgets,
        // but it is not a case in the data pipeline. That's why there are 3 downcast converters for them:
        //
        // 1. The custom inline item (text or inline object) converter (but not the selection).
        editor.conversion.for('downcast').add((dispatcher)=>{
            dispatcher.on('addMarker:restrictedEditingException', (evt, data, conversionApi)=>{
                // Only convert per-item conversion.
                if (!data.item) {
                    return;
                }
                // Do not convert the selection or non-inline items.
                if (data.item.is('selection') || !conversionApi.schema.isInline(data.item)) {
                    return;
                }
                if (!conversionApi.consumable.consume(data.item, evt.name)) {
                    return;
                }
                const viewWriter = conversionApi.writer;
                const viewElement = viewWriter.createAttributeElement('span', {
                    class: 'restricted-editing-exception'
                }, {
                    id: data.markerName,
                    priority: -10
                });
                const viewRange = conversionApi.mapper.toViewRange(data.range);
                const rangeAfterWrap = viewWriter.wrap(viewRange, viewElement);
                for (const element of rangeAfterWrap.getItems()){
                    if (element.is('attributeElement') && element.isSimilar(viewElement)) {
                        conversionApi.mapper.bindElementToMarker(element, data.markerName);
                        break;
                    }
                }
            });
        });
        // 2. The marker-to-highlight converter for the document selection.
        editor.conversion.for('downcast').markerToHighlight({
            model: 'restrictedEditingException',
            // Use callback to return new object every time new marker instance is created - otherwise it will be seen as the same marker.
            view: ()=>{
                return {
                    name: 'span',
                    classes: 'restricted-editing-exception',
                    priority: -10
                };
            }
        });
        // 3. And for collapsed marker we need to render it as an element.
        // Additionally, the editing pipeline should always display a collapsed marker.
        editor.conversion.for('editingDowncast').markerToElement({
            model: 'restrictedEditingException',
            view: (markerData, { writer })=>{
                return writer.createUIElement('span', {
                    class: 'restricted-editing-exception restricted-editing-exception_collapsed'
                });
            }
        });
        editor.conversion.for('dataDowncast').markerToElement({
            model: 'restrictedEditingException',
            view: (markerData, { writer })=>{
                return writer.createEmptyElement('span', {
                    class: 'restricted-editing-exception'
                });
            }
        });
        doc.registerPostFixer(extendMarkerOnTypingPostFixer(editor));
        doc.registerPostFixer(resurrectCollapsedMarkerPostFixer(editor));
        doc.registerPostFixer(ensureNewMarkerIsFlatPostFixer(editor));
        setupExceptionHighlighting(editor);
    }
    /**
	 * Setups additional editing restrictions beyond command toggling:
	 *
	 * * delete content range trimming
	 * * disabling input command outside exception marker
	 * * restricting clipboard holder to text only
	 * * restricting text attributes in content
	 */ _setupRestrictions() {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;
        const viewDoc = editor.editing.view.document;
        const clipboard = editor.plugins.get('ClipboardPipeline');
        this.listenTo(model, 'deleteContent', restrictDeleteContent(editor), {
            priority: 'high'
        });
        const insertTextCommand = editor.commands.get('insertText');
        // The restricted editing might be configured without insert text support - ie allow only bolding or removing text.
        // This check is bit synthetic since only tests are used this way.
        if (insertTextCommand) {
            this.listenTo(insertTextCommand, 'execute', disallowInputExecForWrongRange(editor), {
                priority: 'high'
            });
        }
        // Block clipboard outside exception marker on paste and drop.
        this.listenTo(clipboard, 'contentInsertion', (evt)=>{
            if (!isRangeInsideSingleMarker(editor, selection.getFirstRange())) {
                evt.stop();
            }
        });
        // Block clipboard outside exception marker on cut.
        this.listenTo(viewDoc, 'clipboardOutput', (evt, data)=>{
            if (data.method == 'cut' && !isRangeInsideSingleMarker(editor, selection.getFirstRange())) {
                evt.stop();
            }
        }, {
            priority: 'high'
        });
        const allowedAttributes = editor.config.get('restrictedEditing.allowedAttributes');
        model.schema.addAttributeCheck(onlyAllowAttributesFromList(allowedAttributes));
        model.schema.addChildCheck(allowTextOnlyInClipboardHolder());
    }
    /**
	 * Sets up the command toggling which enables or disables commands based on the user selection.
	 */ _setupCommandsToggling() {
        const editor = this.editor;
        const model = editor.model;
        const doc = model.document;
        this._disableCommands();
        this.listenTo(doc.selection, 'change', this._checkCommands.bind(this));
        this.listenTo(doc, 'change:data', this._checkCommands.bind(this));
    }
    /**
	 * Checks if commands should be enabled or disabled based on the current selection.
	 */ _checkCommands() {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        if (selection.rangeCount > 1) {
            this._disableCommands();
            return;
        }
        const marker = getMarkerAtPosition(editor, selection.focus);
        this._disableCommands();
        if (isSelectionInMarker(selection, marker)) {
            this._enableCommands(marker);
        }
    }
    /**
	 * Enables commands in non-restricted regions.
	 */ _enableCommands(marker) {
        const editor = this.editor;
        for (const [commandName, command] of editor.commands){
            if (!command.affectsData || this._alwaysEnabled.has(commandName)) {
                continue;
            }
            // Enable ony those commands that are allowed in the exception marker.
            if (!this._allowedInException.has(commandName)) {
                continue;
            }
            // Do not enable 'delete' and 'deleteForward' commands on the exception marker boundaries.
            if (isDeleteCommandOnMarkerBoundaries(commandName, editor.model.document.selection, marker.getRange())) {
                continue;
            }
            command.clearForceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
    }
    /**
	 * Disables commands outside non-restricted regions.
	 */ _disableCommands() {
        const editor = this.editor;
        for (const [commandName, command] of editor.commands){
            if (!command.affectsData || this._alwaysEnabled.has(commandName)) {
                continue;
            }
            command.forceDisabled(COMMAND_FORCE_DISABLE_ID);
        }
    }
}
/**
 * Helper for handling Ctrl+A keydown behaviour.
 */ function getSelectAllHandler(editor) {
    return (_, cancel)=>{
        const model = editor.model;
        const selection = editor.model.document.selection;
        const marker = getMarkerAtPosition(editor, selection.focus);
        if (!marker) {
            return;
        }
        // If selection range is inside a restricted editing exception, select text only within the exception.
        //
        // Note: Second Ctrl+A press is also blocked and it won't select the entire text in the editor.
        const selectionRange = selection.getFirstRange();
        const markerRange = marker.getRange();
        if (markerRange.containsRange(selectionRange, true) || selection.isCollapsed) {
            cancel();
            model.change((writer)=>{
                writer.setSelection(marker.getRange());
            });
        }
    };
}
/**
 * Additional rule for enabling "delete" and "deleteForward" commands if selection is on range boundaries:
 *
 * Does not allow to enable command when selection focus is:
 * - is on marker start - "delete" - to prevent removing content before marker
 * - is on marker end - "deleteForward" - to prevent removing content after marker
 */ function isDeleteCommandOnMarkerBoundaries(commandName, selection, markerRange) {
    if (commandName == 'delete' && markerRange.start.isEqual(selection.focus)) {
        return true;
    }
    // Only for collapsed selection - non-collapsed selection that extends over a marker is handled elsewhere.
    if (commandName == 'deleteForward' && selection.isCollapsed && markerRange.end.isEqual(selection.focus)) {
        return true;
    }
    return false;
}
/**
 * Ensures that model.deleteContent() does not delete outside exception markers ranges.
 *
 * The enforced restrictions are:
 * - only execute deleteContent() inside exception markers
 * - restrict passed selection to exception marker
 */ function restrictDeleteContent(editor) {
    return (evt, args)=>{
        const [selection] = args;
        const marker = getMarkerAtPosition(editor, selection.focus) || getMarkerAtPosition(editor, selection.anchor);
        // Stop method execution if marker was not found at selection focus.
        if (!marker) {
            evt.stop();
            return;
        }
        // Collapsed selection inside exception marker does not require fixing.
        if (selection.isCollapsed) {
            return;
        }
        // Shrink the selection to the range inside exception marker.
        const allowedToDelete = marker.getRange().getIntersection(selection.getFirstRange());
        // Some features uses selection passed to model.deleteContent() to set the selection afterwards. For this we need to properly modify
        // either the document selection using change block...
        if (selection.is('documentSelection')) {
            editor.model.change((writer)=>{
                writer.setSelection(allowedToDelete);
            });
        } else {
            selection.setTo(allowedToDelete);
        }
    };
}
/**
 * Ensures that input command is executed with a range that is inside exception marker.
 *
 * This restriction is due to fact that using native spell check changes text outside exception marker.
 */ function disallowInputExecForWrongRange(editor) {
    return (evt, args)=>{
        const [options] = args;
        const { range } = options;
        // Only check "input" command executed with a range value.
        // Selection might be set in exception marker but passed range might point elsewhere.
        if (!range) {
            return;
        }
        if (!isRangeInsideSingleMarker(editor, range)) {
            evt.stop();
        }
    };
}
function isRangeInsideSingleMarker(editor, range) {
    const markerAtStart = getMarkerAtPosition(editor, range.start);
    const markerAtEnd = getMarkerAtPosition(editor, range.end);
    return markerAtStart && markerAtEnd && markerAtEnd === markerAtStart;
}
/**
 * Checks if new marker range is flat. Non-flat ranges might appear during upcast conversion in nested structures, ie tables.
 *
 * Note: This marker fixer only consider case which is possible to create using StandardEditing mode plugin.
 * Markers created by developer in the data might break in many other ways.
 *
 * See #6003.
 */ function ensureNewMarkerIsFlatPostFixer(editor) {
    return (writer)=>{
        let changeApplied = false;
        const changedMarkers = editor.model.document.differ.getChangedMarkers();
        for (const { data, name } of changedMarkers){
            if (!name.startsWith('restrictedEditingException')) {
                continue;
            }
            const newRange = data.newRange;
            if (!data.oldRange && !newRange.isFlat) {
                const start = newRange.start;
                const end = newRange.end;
                const startIsHigherInTree = start.path.length > end.path.length;
                const fixedStart = startIsHigherInTree ? newRange.start : writer.createPositionAt(end.parent, 0);
                const fixedEnd = startIsHigherInTree ? writer.createPositionAt(start.parent, 'end') : newRange.end;
                writer.updateMarker(name, {
                    range: writer.createRange(fixedStart, fixedEnd)
                });
                changeApplied = true;
            }
        }
        return changeApplied;
    };
}
function onlyAllowAttributesFromList(allowedAttributes) {
    return (context, attributeName)=>{
        if (context.startsWith('$clipboardHolder')) {
            return allowedAttributes.includes(attributeName);
        }
    };
}
function allowTextOnlyInClipboardHolder() {
    return (context, childDefinition)=>{
        if (context.startsWith('$clipboardHolder')) {
            return childDefinition.name === '$text';
        }
    };
}

var lockIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15.5 6.5a3.5 3.5 0 0 1 3.495 3.308L19 10v2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1v-2l.005-.192A3.5 3.5 0 0 1 15.5 6.5zm0 7.5a.5.5 0 0 0-.492.41L15 14.5v2a.5.5 0 0 0 .992.09L16 16.5v-2a.5.5 0 0 0-.5-.5zm0-6a2 2 0 0 0-2 2v2h4v-2a2 2 0 0 0-2-2zm-9.25 8a.75.75 0 1 1 0 1.5H.75a.75.75 0 1 1 0-1.5h5.5zm0-5a.75.75 0 1 1 0 1.5H.75a.75.75 0 1 1 0-1.5h5.5zm3-5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5h8.5zm6-5a.75.75 0 1 1 0 1.5H.75a.75.75 0 0 1 0-1.5h14.5z\"/></svg>";

/**
 * The restricted editing mode UI feature.
 *
 * It introduces the `'restrictedEditing'` dropdown that offers tools to navigate between exceptions across
 * the document.
 */ class RestrictedEditingModeUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RestrictedEditingModeUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const t = editor.t;
        editor.ui.componentFactory.add('restrictedEditing', (locale)=>{
            const dropdownView = createDropdown(locale);
            const listItems = new Collection();
            this._getButtonDefinitions().forEach(({ commandName, label, keystroke })=>{
                listItems.add(this._getButtonDefinition(commandName, label, keystroke));
            });
            addListToDropdown(dropdownView, listItems, {
                role: 'menu'
            });
            dropdownView.buttonView.set({
                label: t('Navigate editable regions'),
                icon: lockIcon,
                tooltip: true,
                isEnabled: true,
                isOn: false
            });
            this.listenTo(dropdownView, 'execute', (evt)=>{
                const { _commandName } = evt.source;
                editor.execute(_commandName);
                editor.editing.view.focus();
            });
            return dropdownView;
        });
        editor.ui.componentFactory.add('menuBar:restrictedEditing', (locale)=>{
            const menuView = new MenuBarMenuView(locale);
            const listView = new MenuBarMenuListView(locale);
            listView.set({
                ariaLabel: t('Navigate editable regions'),
                role: 'menu'
            });
            menuView.buttonView.set({
                label: t('Navigate editable regions'),
                icon: lockIcon
            });
            menuView.panelView.children.add(listView);
            this._getButtonDefinitions().forEach(({ commandName, label, keystroke })=>{
                const listItemView = new MenuBarMenuListItemView(locale, menuView);
                const buttonView = this._createMenuBarButton(label, commandName, keystroke);
                buttonView.delegate('execute').to(menuView);
                listItemView.children.add(buttonView);
                listView.items.add(listItemView);
            });
            return menuView;
        });
    }
    /**
	 * Creates a button for restricted editing command to use in menu bar.
	 */ _createMenuBarButton(label, commandName, keystroke) {
        const editor = this.editor;
        const command = editor.commands.get(commandName);
        const view = new MenuBarMenuListItemButtonView(editor.locale);
        view.set({
            label,
            keystroke,
            isEnabled: true,
            isOn: false
        });
        view.bind('isEnabled').to(command);
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute(commandName);
            editor.editing.view.focus();
        });
        return view;
    }
    /**
	 * Returns a definition of the navigation button to be used in the dropdown.
	 *
	 * @param commandName The name of the command that the button represents.
	 * @param label The translated label of the button.
	 * @param keystroke The button keystroke.
	 */ _getButtonDefinition(commandName, label, keystroke) {
        const editor = this.editor;
        const command = editor.commands.get(commandName);
        const definition = {
            type: 'button',
            model: new ViewModel({
                label,
                withText: true,
                keystroke,
                withKeystroke: true,
                role: 'menuitem',
                _commandName: commandName
            })
        };
        definition.model.bind('isEnabled').to(command, 'isEnabled');
        return definition;
    }
    /**
	 * Returns definitions for UI buttons.
	 *
	 * @internal
	 */ _getButtonDefinitions() {
        const t = this.editor.locale.t;
        return [
            {
                commandName: 'goToPreviousRestrictedEditingException',
                label: t('Previous editable region'),
                keystroke: 'Shift+Tab'
            },
            {
                commandName: 'goToNextRestrictedEditingException',
                label: t('Next editable region'),
                keystroke: 'Tab'
            }
        ];
    }
}

/**
 * The restricted editing mode plugin.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * The {@link module:restricted-editing/restrictededitingmodeediting~RestrictedEditingModeEditing restricted mode editing feature}.
 * * The {@link module:restricted-editing/restrictededitingmodeui~RestrictedEditingModeUI restricted mode UI feature}.
 */ class RestrictedEditingMode extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'RestrictedEditingMode';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            RestrictedEditingModeEditing,
            RestrictedEditingModeUI
        ];
    }
}

/**
 * The command that toggles exceptions from the restricted editing on text.
 */ class RestrictedEditingExceptionCommand extends Command {
    /**
	 * @inheritDoc
	 */ refresh() {
        const model = this.editor.model;
        const doc = model.document;
        this.value = !!doc.selection.getAttribute('restrictedEditingException');
        this.isEnabled = model.schema.checkAttributeInSelection(doc.selection, 'restrictedEditingException');
    }
    /**
	 * @inheritDoc
	 */ execute(options = {}) {
        const model = this.editor.model;
        const document = model.document;
        const selection = document.selection;
        const valueToSet = options.forceValue === undefined ? !this.value : options.forceValue;
        model.change((writer)=>{
            const ranges = model.schema.getValidRanges(selection.getRanges(), 'restrictedEditingException');
            if (selection.isCollapsed) {
                if (valueToSet) {
                    writer.setSelectionAttribute('restrictedEditingException', valueToSet);
                } else {
                    const isSameException = (value)=>{
                        return value.item.getAttribute('restrictedEditingException') === this.value;
                    };
                    const focus = selection.focus;
                    const exceptionStart = focus.getLastMatchingPosition(isSameException, {
                        direction: 'backward'
                    });
                    const exceptionEnd = focus.getLastMatchingPosition(isSameException);
                    writer.removeSelectionAttribute('restrictedEditingException');
                    if (!(focus.isEqual(exceptionStart) || focus.isEqual(exceptionEnd))) {
                        writer.removeAttribute('restrictedEditingException', writer.createRange(exceptionStart, exceptionEnd));
                    }
                }
            } else {
                for (const range of ranges){
                    if (valueToSet) {
                        writer.setAttribute('restrictedEditingException', valueToSet, range);
                    } else {
                        writer.removeAttribute('restrictedEditingException', range);
                    }
                }
            }
        });
    }
}

/**
 * The standard editing mode editing feature.
 *
 * * It introduces the `restrictedEditingException` text attribute that is rendered as
 * a `<span>` element with the `restricted-editing-exception` CSS class.
 * * It registers the `'restrictedEditingException'` command.
 */ class StandardEditingModeEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'StandardEditingModeEditing';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.model.schema.extend('$text', {
            allowAttributes: [
                'restrictedEditingException'
            ]
        });
        editor.conversion.for('upcast').elementToAttribute({
            model: 'restrictedEditingException',
            view: {
                name: 'span',
                classes: 'restricted-editing-exception'
            }
        });
        editor.conversion.for('downcast').attributeToElement({
            model: 'restrictedEditingException',
            view: (modelAttributeValue, { writer })=>{
                if (modelAttributeValue) {
                    // Make the restricted editing <span> outer-most in the view.
                    return writer.createAttributeElement('span', {
                        class: 'restricted-editing-exception'
                    }, {
                        priority: -10
                    });
                }
            }
        });
        editor.commands.add('restrictedEditingException', new RestrictedEditingExceptionCommand(editor));
        editor.editing.view.change((writer)=>{
            for (const root of editor.editing.view.document.roots){
                writer.addClass('ck-restricted-editing_mode_standard', root);
            }
        });
    }
}

var unlockIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6.25 16a.75.75 0 1 1 0 1.5H.75a.75.75 0 1 1 0-1.5h5.5zm0-5a.75.75 0 1 1 0 1.5H.75a.75.75 0 1 1 0-1.5h5.5zm3-5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5h8.5zm6-5a.75.75 0 1 1 0 1.5H.75a.75.75 0 0 1 0-1.5h14.5zm.25 5.5a3.5 3.5 0 0 1 3.143 1.959.75.75 0 0 1-1.36.636A2 2 0 0 0 13.5 10v2H19a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1v-2l.005-.192A3.5 3.5 0 0 1 15.5 6.5zm0 7.5a.5.5 0 0 0-.492.41L15 14.5v2a.5.5 0 0 0 .992.09L16 16.5v-2a.5.5 0 0 0-.5-.5z\"/></svg>";

/**
 * The standard editing mode UI feature.
 *
 * It introduces the `'restrictedEditingException'` button that marks text as unrestricted for editing.
 */ class StandardEditingModeUI extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'StandardEditingModeUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        editor.ui.componentFactory.add('restrictedEditingException', ()=>{
            const button = this._createButton(ButtonView);
            button.set({
                tooltip: true,
                isToggleable: true
            });
            return button;
        });
        editor.ui.componentFactory.add('menuBar:restrictedEditingException', ()=>{
            return this._createButton(MenuBarMenuListItemButtonView);
        });
    }
    /**
	 * Creates a button for restricted editing exception command to use either in toolbar or in menu bar.
	 */ _createButton(ButtonClass) {
        const editor = this.editor;
        const locale = editor.locale;
        const command = this.editor.commands.get('restrictedEditingException');
        const view = new ButtonClass(locale);
        const t = locale.t;
        view.icon = unlockIcon;
        view.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');
        view.bind('label').to(command, 'value', (value)=>{
            return value ? t('Disable editing') : t('Enable editing');
        });
        // Execute the command.
        this.listenTo(view, 'execute', ()=>{
            editor.execute('restrictedEditingException');
            editor.editing.view.focus();
        });
        return view;
    }
}

/**
 * The standard editing mode plugin.
 *
 * This is a "glue" plugin that loads the following plugins:
 *
 * * The {@link module:restricted-editing/standardeditingmodeediting~StandardEditingModeEditing standard mode editing feature}.
 * * The {@link module:restricted-editing/standardeditingmodeui~StandardEditingModeUI standard mode UI feature}.
 */ class StandardEditingMode extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'StandardEditingMode';
    }
    static get requires() {
        return [
            StandardEditingModeEditing,
            StandardEditingModeUI
        ];
    }
}

export { RestrictedEditingMode, RestrictedEditingModeEditing, RestrictedEditingModeUI, StandardEditingMode, StandardEditingModeEditing, StandardEditingModeUI };
//# sourceMappingURL=index.js.map
