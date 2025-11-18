/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module clipboard/lineview
 */
import { View } from '@ckeditor/ckeditor5-ui';
/**
 * The horizontal drop target line view.
 */
export default class LineView extends View {
    /**
     * Controls whether the line is visible.
     *
     * @observable
     * @default false
     */
    isVisible: boolean;
    /**
     * Controls the line position x coordinate.
     *
     * @observable
     * @default null
     */
    left: number | null;
    /**
     * Controls the line width.
     *
     * @observable
     * @default null
     */
    width: number | null;
    /**
     * Controls the line position y coordinate.
     *
     * @observable
     * @default null
     */
    top: number | null;
    /**
     * @inheritDoc
     */
    constructor();
}
