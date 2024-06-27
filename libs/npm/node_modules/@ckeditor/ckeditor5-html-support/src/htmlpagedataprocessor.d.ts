/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module html-support/htmlpagedataprocessor
 */
import { HtmlDataProcessor, type ViewDocumentFragment } from 'ckeditor5/src/engine.js';
/**
 * The full page HTML data processor class.
 * This data processor implementation uses HTML as input and output data.
 */
export default class HtmlPageDataProcessor extends HtmlDataProcessor {
    /**
     * @inheritDoc
     */
    toView(data: string): ViewDocumentFragment;
    /**
     * @inheritDoc
     */
    toData(viewFragment: ViewDocumentFragment): string;
}
