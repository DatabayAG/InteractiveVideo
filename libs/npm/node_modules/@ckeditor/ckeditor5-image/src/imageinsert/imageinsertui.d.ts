/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module image/imageinsert/imageinsertui
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { type Observable } from 'ckeditor5/src/utils.js';
import { type ButtonView, type DropdownView, type FocusableView, type MenuBarMenuListItemButtonView } from 'ckeditor5/src/ui.js';
import ImageUtils from '../imageutils.js';
/**
 * The image insert dropdown plugin.
 *
 * For a detailed overview, check the {@glink features/images/image-upload/image-upload Image upload feature}
 * and {@glink features/images/images-inserting Insert images via source URL} documentation.
 *
 * Adds the `'insertImage'` dropdown to the {@link module:ui/componentfactory~ComponentFactory UI component factory}
 * and also the `imageInsert` dropdown as an alias for backward compatibility.
 *
 * Adds the `'menuBar:insertImage'` sub-menu to the {@link module:ui/componentfactory~ComponentFactory UI component factory}, which is
 * by default added to the `'Insert'` menu.
 */
export default class ImageInsertUI extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "ImageInsertUI";
    /**
     * @inheritDoc
     */
    static get requires(): readonly [typeof ImageUtils];
    /**
     * The dropdown view responsible for displaying the image insert UI.
     */
    dropdownView?: DropdownView;
    /**
     * Observable property used to alter labels while some image is selected and when it is not.
     *
     * @observable
     */
    isImageSelected: boolean;
    /**
     * Registered integrations map.
     */
    private _integrations;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
    /**
     * Registers the insert image dropdown integration.
     */
    registerIntegration({ name, observable, buttonViewCreator, formViewCreator, menuBarButtonViewCreator, requiresForm }: {
        name: string;
        observable: (Observable & {
            isEnabled: boolean;
        }) | (() => Observable & {
            isEnabled: boolean;
        });
        buttonViewCreator: (isOnlyOne: boolean) => ButtonView;
        formViewCreator: (isOnlyOne: boolean) => FocusableView;
        menuBarButtonViewCreator: (isOnlyOne: boolean) => MenuBarMenuListItemButtonView;
        requiresForm?: boolean;
    }): void;
    /**
     * Creates the toolbar component.
     */
    private _createToolbarComponent;
    /**
     * Creates the menu bar component.
     */
    private _createMenuBarComponent;
    /**
     * Validates the integrations list.
     */
    private _prepareIntegrations;
}
