/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module core
 */
export { default as Plugin, type PluginDependencies, type PluginConstructor } from './plugin.js';
export { default as Command, type CommandExecuteEvent } from './command.js';
export { default as MultiCommand } from './multicommand.js';
export type { CommandsMap } from './commandcollection.js';
export type { PluginsMap, default as PluginCollection } from './plugincollection.js';
export { default as Context, type ContextConfig } from './context.js';
export { default as ContextPlugin, type ContextPluginDependencies } from './contextplugin.js';
export { type EditingKeystrokeCallback } from './editingkeystrokehandler.js';
export type { PartialBy, NonEmptyArray, HexColor } from './typings.js';
export { default as Editor, type EditorReadyEvent, type EditorDestroyEvent } from './editor/editor.js';
export type { EditorConfig, LanguageConfig, ToolbarConfig, ToolbarConfigItem, UiConfig } from './editor/editorconfig.js';
export { default as attachToForm } from './editor/utils/attachtoform.js';
export { default as DataApiMixin, type DataApi } from './editor/utils/dataapimixin.js';
export { default as ElementApiMixin, type ElementApi } from './editor/utils/elementapimixin.js';
export { default as secureSourceElement } from './editor/utils/securesourceelement.js';
export { default as PendingActions, type PendingAction } from './pendingactions.js';
export type { KeystrokeInfos as KeystrokeInfoDefinitions, KeystrokeInfoGroup as KeystrokeInfoGroupDefinition, KeystrokeInfoCategory as KeystrokeInfoCategoryDefinition, KeystrokeInfoDefinition as KeystrokeInfoDefinition } from './accessibility.js';
export declare const icons: {
    bold: string;
    cancel: string;
    caption: string;
    check: string;
    cog: string;
    colorPalette: string;
    eraser: string;
    history: string;
    image: string;
    imageUpload: string;
    imageAssetManager: string;
    imageUrl: string;
    lowVision: string;
    textAlternative: string;
    loupe: string;
    previousArrow: string;
    nextArrow: string;
    importExport: string;
    paragraph: string;
    plus: string;
    text: string;
    alignBottom: string;
    alignMiddle: string;
    alignTop: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    alignJustify: string;
    objectLeft: string;
    objectCenter: string;
    objectRight: string;
    objectFullWidth: string;
    objectInline: string;
    objectBlockLeft: string;
    objectBlockRight: string;
    objectSizeCustom: string;
    objectSizeFull: string;
    objectSizeLarge: string;
    objectSizeSmall: string;
    objectSizeMedium: string;
    pencil: string;
    pilcrow: string;
    quote: string;
    threeVerticalDots: string;
    dragIndicator: string;
    redo: string;
    undo: string;
    bulletedList: string;
    numberedList: string;
    todoList: string;
    codeBlock: string;
    browseFiles: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    horizontalLine: string;
    html: string;
    indent: string;
    outdent: string;
    table: string;
};
import './augmentation.js';
