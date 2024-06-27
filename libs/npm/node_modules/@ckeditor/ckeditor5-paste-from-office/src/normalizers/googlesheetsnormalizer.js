/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module paste-from-office/normalizers/googlesheetsnormalizer
 */
import { UpcastWriter } from 'ckeditor5/src/engine.js';
import removeXmlns from '../filters/removexmlns.js';
import removeGoogleSheetsTag from '../filters/removegooglesheetstag.js';
import removeInvalidTableWidth from '../filters/removeinvalidtablewidth.js';
import removeStyleBlock from '../filters/removestyleblock.js';
const googleSheetsMatch = /<google-sheets-html-origin/i;
/**
 * Normalizer for the content pasted from Google Sheets.
 */
export default class GoogleSheetsNormalizer {
    /**
     * Creates a new `GoogleSheetsNormalizer` instance.
     *
     * @param document View document.
     */
    constructor(document) {
        this.document = document;
    }
    /**
     * @inheritDoc
     */
    isActive(htmlString) {
        return googleSheetsMatch.test(htmlString);
    }
    /**
     * @inheritDoc
     */
    execute(data) {
        const writer = new UpcastWriter(this.document);
        const { body: documentFragment } = data._parsedData;
        removeGoogleSheetsTag(documentFragment, writer);
        removeXmlns(documentFragment, writer);
        removeInvalidTableWidth(documentFragment, writer);
        removeStyleBlock(documentFragment, writer);
        data.content = documentFragment;
    }
}
