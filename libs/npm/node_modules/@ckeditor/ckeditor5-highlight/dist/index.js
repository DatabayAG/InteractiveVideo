/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Command, Plugin, icons } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ButtonView, createDropdown, SplitButtonView, addToolbarToDropdown, MenuBarMenuView, MenuBarMenuListView, MenuBarMenuListItemView, MenuBarMenuListItemButtonView, ListSeparatorView, ToolbarSeparatorView } from '@ckeditor/ckeditor5-ui/dist/index.js';

/**
 * The highlight command. It is used by the {@link module:highlight/highlightediting~HighlightEditing highlight feature}
 * to apply the text highlighting.
 *
 * ```ts
 * editor.execute( 'highlight', { value: 'greenMarker' } );
 * ```
 *
 * **Note**: Executing the command without a value removes the attribute from the model. If the selection is collapsed
 * inside a text with the highlight attribute, the command will remove the attribute from the entire range
 * of that text.
 */ class HighlightCommand extends Command {
    /**
	 * @inheritDoc
	 */ refresh() {
        const model = this.editor.model;
        const doc = model.document;
        this.value = doc.selection.getAttribute('highlight');
        this.isEnabled = model.schema.checkAttributeInSelection(doc.selection, 'highlight');
    }
    /**
	 * Executes the command.
	 *
	 * @param options Options for the executed command.
	 * @param options.value The value to apply.
	 *
	 * @fires execute
	 */ execute(options = {}) {
        const model = this.editor.model;
        const document = model.document;
        const selection = document.selection;
        const highlighter = options.value;
        model.change((writer)=>{
            if (selection.isCollapsed) {
                const position = selection.getFirstPosition();
                // When selection is inside text with `highlight` attribute.
                if (selection.hasAttribute('highlight')) {
                    // Find the full highlighted range.
                    const isSameHighlight = (value)=>{
                        return value.item.hasAttribute('highlight') && value.item.getAttribute('highlight') === this.value;
                    };
                    const highlightStart = position.getLastMatchingPosition(isSameHighlight, {
                        direction: 'backward'
                    });
                    const highlightEnd = position.getLastMatchingPosition(isSameHighlight);
                    const highlightRange = writer.createRange(highlightStart, highlightEnd);
                    // Then depending on current value...
                    if (!highlighter || this.value === highlighter) {
                        // ...remove attribute when passing highlighter different then current or executing "eraser".
                        // If we're at the end of the highlighted range, we don't want to remove highlight of the range.
                        if (!position.isEqual(highlightEnd)) {
                            writer.removeAttribute('highlight', highlightRange);
                        }
                        writer.removeSelectionAttribute('highlight');
                    } else {
                        // ...update `highlight` value.
                        // If we're at the end of the highlighted range, we don't want to change the highlight of the range.
                        if (!position.isEqual(highlightEnd)) {
                            writer.setAttribute('highlight', highlighter, highlightRange);
                        }
                        writer.setSelectionAttribute('highlight', highlighter);
                    }
                } else if (highlighter) {
                    writer.setSelectionAttribute('highlight', highlighter);
                }
            } else {
                const ranges = model.schema.getValidRanges(selection.getRanges(), 'highlight');
                for (const range of ranges){
                    if (highlighter) {
                        writer.setAttribute('highlight', highlighter, range);
                    } else {
                        writer.removeAttribute('highlight', range);
                    }
                }
            }
        });
    }
}

/**
 * The highlight editing feature. It introduces the {@link module:highlight/highlightcommand~HighlightCommand command} and the `highlight`
 * attribute in the {@link module:engine/model/model~Model model} which renders in the {@link module:engine/view/view view}
 * as a `<mark>` element with a `class` attribute (`<mark class="marker-green">...</mark>`) depending
 * on the {@link module:highlight/highlightconfig~HighlightConfig configuration}.
 */ class HighlightEditing extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'HighlightEditing';
    }
    /**
	 * @inheritDoc
	 */ constructor(editor){
        super(editor);
        editor.config.define('highlight', {
            options: [
                {
                    model: 'yellowMarker',
                    class: 'marker-yellow',
                    title: 'Yellow marker',
                    color: 'var(--ck-highlight-marker-yellow)',
                    type: 'marker'
                },
                {
                    model: 'greenMarker',
                    class: 'marker-green',
                    title: 'Green marker',
                    color: 'var(--ck-highlight-marker-green)',
                    type: 'marker'
                },
                {
                    model: 'pinkMarker',
                    class: 'marker-pink',
                    title: 'Pink marker',
                    color: 'var(--ck-highlight-marker-pink)',
                    type: 'marker'
                },
                {
                    model: 'blueMarker',
                    class: 'marker-blue',
                    title: 'Blue marker',
                    color: 'var(--ck-highlight-marker-blue)',
                    type: 'marker'
                },
                {
                    model: 'redPen',
                    class: 'pen-red',
                    title: 'Red pen',
                    color: 'var(--ck-highlight-pen-red)',
                    type: 'pen'
                },
                {
                    model: 'greenPen',
                    class: 'pen-green',
                    title: 'Green pen',
                    color: 'var(--ck-highlight-pen-green)',
                    type: 'pen'
                }
            ]
        });
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        // Allow highlight attribute on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: 'highlight'
        });
        const options = editor.config.get('highlight.options');
        // Set-up the two-way conversion.
        editor.conversion.attributeToElement(_buildDefinition(options));
        editor.commands.add('highlight', new HighlightCommand(editor));
    }
}
/**
 * Converts the options array to a converter definition.
 *
 * @param options An array with configured options.
 */ function _buildDefinition(options) {
    const definition = {
        model: {
            key: 'highlight',
            values: []
        },
        view: {}
    };
    for (const option of options){
        definition.model.values.push(option.model);
        definition.view[option.model] = {
            name: 'mark',
            classes: option.class
        };
    }
    return definition;
}

var markerIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path class=\"ck-icon__fill\" d=\"M10.798 1.59 3.002 12.875l1.895 1.852 2.521 1.402 6.997-12.194z\"/><path d=\"m2.556 16.727.234-.348c-.297-.151-.462-.293-.498-.426-.036-.137.002-.416.115-.837.094-.25.15-.449.169-.595a4.495 4.495 0 0 0 0-.725c-.209-.621-.303-1.041-.284-1.26.02-.218.178-.506.475-.862l6.77-9.414c.539-.91 1.605-.85 3.199.18 1.594 1.032 2.188 1.928 1.784 2.686l-5.877 10.36c-.158.412-.333.673-.526.782-.193.108-.604.179-1.232.21-.362.131-.608.237-.738.318-.13.081-.305.238-.526.47-.293.265-.504.397-.632.397-.096 0-.27-.075-.524-.226l-.31.41-1.6-1.12zm-.279.415 1.575 1.103-.392.515H1.19l1.087-1.618zm8.1-13.656-4.953 6.9L8.75 12.57l4.247-7.574c.175-.25-.188-.647-1.092-1.192-.903-.546-1.412-.652-1.528-.32zM8.244 18.5 9.59 17h9.406v1.5H8.245z\"/></svg>";

var penIcon = "<svg viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path class=\"ck-icon__fill\" d=\"M10.126 2.268 2.002 13.874l1.895 1.852 2.521 1.402L14.47 5.481l-1.543-2.568-2.801-.645z\"/><path d=\"m4.5 18.088-2.645-1.852-.04-2.95-.006-.005.006-.008v-.025l.011.008L8.73 2.97c.165-.233.356-.417.567-.557l-1.212.308L4.604 7.9l-.83-.558 3.694-5.495 2.708-.69 1.65 1.145.046.018.85-1.216 2.16 1.512-.856 1.222c.828.967 1.144 2.141.432 3.158L7.55 17.286l.006.005-3.055.797H4.5zm-.634.166-1.976.516-.026-1.918 2.002 1.402zM9.968 3.817l-.006-.004-6.123 9.184 3.277 2.294 6.108-9.162.005.003c.317-.452-.16-1.332-1.064-1.966-.891-.624-1.865-.776-2.197-.349zM8.245 18.5 9.59 17h9.406v1.5H8.245z\"/></svg>";

/**
 * The default highlight UI plugin. It introduces:
 *
 * * The `'highlight'` dropdown,
 * * The `'removeHighlight'` and `'highlight:*'` buttons.
 *
 * The default configuration includes the following buttons:
 *
 * * `'highlight:yellowMarker'`
 * * `'highlight:greenMarker'`
 * * `'highlight:pinkMarker'`
 * * `'highlight:blueMarker'`
 * * `'highlight:redPen'`
 * * `'highlight:greenPen'`
 *
 * See the {@link module:highlight/highlightconfig~HighlightConfig#options configuration} to learn more
 * about the defaults.
 */ class HighlightUI extends Plugin {
    /**
	 * Returns the localized option titles provided by the plugin.
	 *
	 * The following localized titles corresponding with default
	 * {@link module:highlight/highlightconfig~HighlightConfig#options} are available:
	 *
	 * * `'Yellow marker'`,
	 * * `'Green marker'`,
	 * * `'Pink marker'`,
	 * * `'Blue marker'`,
	 * * `'Red pen'`,
	 * * `'Green pen'`.
	 */ get localizedOptionTitles() {
        const t = this.editor.t;
        return {
            'Yellow marker': t('Yellow marker'),
            'Green marker': t('Green marker'),
            'Pink marker': t('Pink marker'),
            'Blue marker': t('Blue marker'),
            'Red pen': t('Red pen'),
            'Green pen': t('Green pen')
        };
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'HighlightUI';
    }
    /**
	 * @inheritDoc
	 */ init() {
        const options = this.editor.config.get('highlight.options');
        for (const option of options){
            this._addHighlighterButton(option);
        }
        this._addRemoveHighlightButton();
        this._addDropdown(options);
        this._addMenuBarButton(options);
    }
    /**
	 * Creates the "Remove highlight" button.
	 */ _addRemoveHighlightButton() {
        const t = this.editor.t;
        const command = this.editor.commands.get('highlight');
        this._addButton('removeHighlight', t('Remove highlight'), icons.eraser, null, (button)=>{
            button.bind('isEnabled').to(command, 'isEnabled');
        });
    }
    /**
	 * Creates a toolbar button from the provided highlight option.
	 */ _addHighlighterButton(option) {
        const command = this.editor.commands.get('highlight');
        // TODO: change naming
        this._addButton('highlight:' + option.model, option.title, getIconForType(option.type), option.model, decorateHighlightButton);
        function decorateHighlightButton(button) {
            button.bind('isEnabled').to(command, 'isEnabled');
            button.bind('isOn').to(command, 'value', (value)=>value === option.model);
            button.iconView.fillColor = option.color;
            button.isToggleable = true;
        }
    }
    /**
	 * Internal method for creating highlight buttons.
	 *
	 * @param name The name of the button.
	 * @param label The label for the button.
	 * @param icon The button icon.
	 * @param value The `value` property passed to the executed command.
	 * @param decorateButton A callback getting ButtonView instance so that it can be further customized.
	 */ _addButton(name, label, icon, value, decorateButton) {
        const editor = this.editor;
        editor.ui.componentFactory.add(name, (locale)=>{
            const buttonView = new ButtonView(locale);
            const localized = this.localizedOptionTitles[label] ? this.localizedOptionTitles[label] : label;
            buttonView.set({
                label: localized,
                icon,
                tooltip: true
            });
            buttonView.on('execute', ()=>{
                editor.execute('highlight', {
                    value
                });
                editor.editing.view.focus();
            });
            // Add additional behavior for buttonView.
            decorateButton(buttonView);
            return buttonView;
        });
    }
    /**
	 * Creates the split button dropdown UI from the provided highlight options.
	 */ _addDropdown(options) {
        const editor = this.editor;
        const t = editor.t;
        const componentFactory = editor.ui.componentFactory;
        const startingHighlighter = options[0];
        const optionsMap = options.reduce((retVal, option)=>{
            retVal[option.model] = option;
            return retVal;
        }, {});
        componentFactory.add('highlight', (locale)=>{
            const command = editor.commands.get('highlight');
            const dropdownView = createDropdown(locale, SplitButtonView);
            const splitButtonView = dropdownView.buttonView;
            splitButtonView.set({
                label: t('Highlight'),
                tooltip: true,
                // Holds last executed highlighter.
                lastExecuted: startingHighlighter.model,
                // Holds current highlighter to execute (might be different then last used).
                commandValue: startingHighlighter.model,
                isToggleable: true
            });
            // Dropdown button changes to selection (command.value):
            // - If selection is in highlight it get active highlight appearance (icon, color) and is activated.
            // - Otherwise it gets appearance (icon, color) of last executed highlight.
            splitButtonView.bind('icon').to(command, 'value', (value)=>getIconForType(getActiveOption(value, 'type')));
            splitButtonView.bind('color').to(command, 'value', (value)=>getActiveOption(value, 'color'));
            splitButtonView.bind('commandValue').to(command, 'value', (value)=>getActiveOption(value, 'model'));
            splitButtonView.bind('isOn').to(command, 'value', (value)=>!!value);
            splitButtonView.delegate('execute').to(dropdownView);
            // Create buttons array.
            const buttonsCreator = ()=>{
                const buttons = options.map((option)=>{
                    // Get existing highlighter button.
                    const buttonView = componentFactory.create('highlight:' + option.model);
                    // Update lastExecutedHighlight on execute.
                    this.listenTo(buttonView, 'execute', ()=>{
                        dropdownView.buttonView.set({
                            lastExecuted: option.model
                        });
                    });
                    return buttonView;
                });
                // Add separator and eraser buttons to dropdown.
                buttons.push(new ToolbarSeparatorView());
                buttons.push(componentFactory.create('removeHighlight'));
                return buttons;
            };
            // Make toolbar button enabled when any button in dropdown is enabled before adding separator and eraser.
            dropdownView.bind('isEnabled').to(command, 'isEnabled');
            addToolbarToDropdown(dropdownView, buttonsCreator, {
                enableActiveItemFocusOnDropdownOpen: true,
                ariaLabel: t('Text highlight toolbar')
            });
            bindToolbarIconStyleToActiveColor(dropdownView);
            // Execute current action from dropdown's split button action button.
            splitButtonView.on('execute', ()=>{
                editor.execute('highlight', {
                    value: splitButtonView.commandValue
                });
            });
            // Focus the editable after executing the command.
            // It overrides a default behaviour where the focus is moved to the dropdown button (#12125).
            this.listenTo(dropdownView, 'execute', ()=>{
                editor.editing.view.focus();
            });
            /**
			 * Returns active highlighter option depending on current command value.
			 * If current is not set or it is the same as last execute this method will return the option key (like icon or color)
			 * of last executed highlighter. Otherwise it will return option key for current one.
			 */ function getActiveOption(current, key) {
                const whichHighlighter = !current || current === splitButtonView.lastExecuted ? splitButtonView.lastExecuted : current;
                return optionsMap[whichHighlighter][key];
            }
            return dropdownView;
        });
    }
    /**
	 * Creates the menu bar button for highlight including submenu with available options.
	 */ _addMenuBarButton(options) {
        const editor = this.editor;
        const t = editor.t;
        editor.ui.componentFactory.add('menuBar:highlight', (locale)=>{
            const command = editor.commands.get('highlight');
            const menuView = new MenuBarMenuView(locale);
            menuView.buttonView.set({
                label: t('Highlight'),
                icon: getIconForType('marker')
            });
            menuView.bind('isEnabled').to(command);
            menuView.buttonView.iconView.fillColor = 'transparent';
            const listView = new MenuBarMenuListView(locale);
            for (const option of options){
                const listItemView = new MenuBarMenuListItemView(locale, menuView);
                const buttonView = new MenuBarMenuListItemButtonView(locale);
                buttonView.set({
                    label: option.title,
                    icon: getIconForType(option.type)
                });
                buttonView.delegate('execute').to(menuView);
                buttonView.bind('isOn').to(command, 'value', (value)=>value === option.model);
                buttonView.bind('ariaChecked').to(buttonView, 'isOn');
                buttonView.iconView.bind('fillColor').to(buttonView, 'isOn', (value)=>value ? 'transparent' : option.color);
                buttonView.on('execute', ()=>{
                    editor.execute('highlight', {
                        value: option.model
                    });
                    editor.editing.view.focus();
                });
                listItemView.children.add(buttonView);
                listView.items.add(listItemView);
            }
            // Add remove highlight button
            listView.items.add(new ListSeparatorView(locale));
            const listItemView = new MenuBarMenuListItemView(locale, menuView);
            const buttonView = new MenuBarMenuListItemButtonView(locale);
            buttonView.set({
                label: t('Remove highlight'),
                icon: icons.eraser
            });
            buttonView.delegate('execute').to(menuView);
            buttonView.on('execute', ()=>{
                editor.execute('highlight', {
                    value: null
                });
                editor.editing.view.focus();
            });
            listItemView.children.add(buttonView);
            listView.items.add(listItemView);
            menuView.panelView.children.add(listView);
            return menuView;
        });
    }
}
/**
 * Extends split button icon style to reflect last used button style.
 */ function bindToolbarIconStyleToActiveColor(dropdownView) {
    const actionView = dropdownView.buttonView.actionView;
    actionView.iconView.bind('fillColor').to(dropdownView.buttonView, 'color');
}
/**
 * Returns icon for given highlighter type.
 */ function getIconForType(type) {
    return type === 'marker' ? markerIcon : penIcon;
}

/**
 * The highlight plugin.
 *
 * For a detailed overview, check the {@glink features/highlight Highlight feature} documentation.
 *
 * This is a "glue" plugin which loads the {@link module:highlight/highlightediting~HighlightEditing} and
 * {@link module:highlight/highlightui~HighlightUI} plugins.
 */ class Highlight extends Plugin {
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            HighlightEditing,
            HighlightUI
        ];
    }
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'Highlight';
    }
}

export { Highlight, HighlightEditing, HighlightUI };
//# sourceMappingURL=index.js.map
