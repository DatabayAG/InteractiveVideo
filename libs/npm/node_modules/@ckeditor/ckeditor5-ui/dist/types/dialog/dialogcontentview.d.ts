/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module ui/dialog/dialogcontentview
 */
import View from '../view.js';
import type ViewCollection from '../viewcollection.js';
import type { Locale } from '@ckeditor/ckeditor5-utils';
/**
 * A dialog content view class.
 */
export default class DialogContentView extends View {
    /**
     * A collection of content items.
     */
    readonly children: ViewCollection;
    /**
     * @inheritDoc
     */
    constructor(locale: Locale | undefined);
    /**
     * Removes all the child views.
     */
    reset(): void;
}
