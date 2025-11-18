/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module media-embed/mediaembedediting
 */
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import MediaRegistry from './mediaregistry.js';
import '../theme/mediaembedediting.css';
/**
 * The media embed editing feature.
 */
export default class MediaEmbedEditing extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName(): "MediaEmbedEditing";
    /**
     * The media registry managing the media providers in the editor.
     */
    registry: MediaRegistry;
    /**
     * @inheritDoc
     */
    constructor(editor: Editor);
    /**
     * @inheritDoc
     */
    init(): void;
}
