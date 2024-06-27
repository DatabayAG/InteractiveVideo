/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/colorgrid/colortileview
 */
import ButtonView from '../button/buttonview.js';
import { type Locale } from '@ckeditor/ckeditor5-utils';
/**
 * This class represents a single color tile in the {@link module:ui/colorgrid/colorgridview~ColorGridView}.
 */
export default class ColorTileView extends ButtonView {
    /**
     * String representing a color shown as tile's background.
     */
    color: string | undefined;
    /**
     * A flag that toggles a special CSS class responsible for displaying
     * a border around the button.
     */
    hasBorder: boolean;
    constructor(locale?: Locale);
    /**
     * @inheritDoc
     */
    render(): void;
}
