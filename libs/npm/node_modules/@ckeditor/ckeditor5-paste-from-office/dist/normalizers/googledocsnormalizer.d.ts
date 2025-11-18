/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module paste-from-office/normalizers/googledocsnormalizer
 */
import { type ViewDocument } from 'ckeditor5/src/engine.js';
import type { Normalizer, NormalizerData } from '../normalizer.js';
/**
 * Normalizer for the content pasted from Google Docs.
 */
export default class GoogleDocsNormalizer implements Normalizer {
    readonly document: ViewDocument;
    /**
     * Creates a new `GoogleDocsNormalizer` instance.
     *
     * @param document View document.
     */
    constructor(document: ViewDocument);
    /**
     * @inheritDoc
     */
    isActive(htmlString: string): boolean;
    /**
     * @inheritDoc
     */
    execute(data: NormalizerData): void;
}
