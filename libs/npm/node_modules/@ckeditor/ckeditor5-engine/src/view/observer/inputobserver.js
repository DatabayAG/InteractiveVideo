/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/inputobserver
 */
import DomEventObserver from './domeventobserver.js';
import DataTransfer from '../datatransfer.js';
import { env } from '@ckeditor/ckeditor5-utils';
/**
 * Observer for events connected with data input.
 *
 * **Note**: This observer is attached by {@link module:engine/view/view~View} and available by default in all
 * editor instances.
 */
export default class InputObserver extends DomEventObserver {
    constructor() {
        super(...arguments);
        /**
         * @inheritDoc
         */
        this.domEventType = 'beforeinput';
    }
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent) {
        // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
        // @if CK_DEBUG_TYPING // 	console.group( `%c[InputObserver]%c ${ domEvent.type }: ${ domEvent.inputType }`,
        // @if CK_DEBUG_TYPING // 		'color: green', 'color: default'
        // @if CK_DEBUG_TYPING // 	);
        // @if CK_DEBUG_TYPING // }
        const domTargetRanges = domEvent.getTargetRanges();
        const view = this.view;
        const viewDocument = view.document;
        let dataTransfer = null;
        let data = null;
        let targetRanges = [];
        if (domEvent.dataTransfer) {
            dataTransfer = new DataTransfer(domEvent.dataTransfer);
        }
        if (domEvent.data !== null) {
            data = domEvent.data;
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.info( `%c[InputObserver]%c event data: %c${ JSON.stringify( data ) }`,
            // @if CK_DEBUG_TYPING // 		'color: green;font-weight: bold', 'font-weight:bold', 'color: blue;'
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
        }
        else if (dataTransfer) {
            data = dataTransfer.getData('text/plain');
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.info( `%c[InputObserver]%c event data transfer: %c${ JSON.stringify( data ) }`,
            // @if CK_DEBUG_TYPING // 		'color: green;font-weight: bold', 'font-weight:bold', 'color: blue;'
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
        }
        // If the editor selection is fake (an object is selected), the DOM range does not make sense because it is anchored
        // in the fake selection container.
        if (viewDocument.selection.isFake) {
            // Future-proof: in case of multi-range fake selections being possible.
            targetRanges = Array.from(viewDocument.selection.getRanges());
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.info( '%c[InputObserver]%c using fake selection:',
            // @if CK_DEBUG_TYPING // 		'color: green;font-weight: bold', 'font-weight:bold', targetRanges,
            // @if CK_DEBUG_TYPING // 		viewDocument.selection.isFake ? 'fake view selection' : 'fake DOM parent'
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
        }
        else if (domTargetRanges.length) {
            targetRanges = domTargetRanges.map(domRange => {
                // Sometimes browser provides range that starts before editable node.
                // We try to fall back to collapsed range at the valid end position.
                // See https://github.com/ckeditor/ckeditor5/issues/14411.
                // See https://github.com/ckeditor/ckeditor5/issues/14050.
                const viewStart = view.domConverter.domPositionToView(domRange.startContainer, domRange.startOffset);
                const viewEnd = view.domConverter.domPositionToView(domRange.endContainer, domRange.endOffset);
                if (viewStart) {
                    return view.createRange(viewStart, viewEnd);
                }
                else if (viewEnd) {
                    return view.createRange(viewEnd);
                }
            }).filter((range) => !!range);
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.info( '%c[InputObserver]%c using target ranges:',
            // @if CK_DEBUG_TYPING // 		'color: green;font-weight: bold', 'font-weight:bold', targetRanges
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
        }
        // For Android devices we use a fallback to the current DOM selection, Android modifies it according
        // to the expected target ranges of input event.
        else if (env.isAndroid) {
            const domSelection = domEvent.target.ownerDocument.defaultView.getSelection();
            targetRanges = Array.from(view.domConverter.domSelectionToView(domSelection).getRanges());
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.info( '%c[InputObserver]%c using selection ranges:',
            // @if CK_DEBUG_TYPING // 		'color: green;font-weight: bold', 'font-weight:bold', targetRanges
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
        }
        // Android sometimes fires insertCompositionText with a new-line character at the end of the data
        // instead of firing insertParagraph beforeInput event.
        // Fire the correct type of beforeInput event and ignore the replaced fragment of text because
        // it wants to replace "test" with "test\n".
        // https://github.com/ckeditor/ckeditor5/issues/12368.
        if (env.isAndroid && domEvent.inputType == 'insertCompositionText' && data && data.endsWith('\n')) {
            this.fire(domEvent.type, domEvent, {
                inputType: 'insertParagraph',
                targetRanges: [view.createRange(targetRanges[0].end)]
            });
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.groupEnd();
            // @if CK_DEBUG_TYPING // }
            return;
        }
        // Normalize the insertText data that includes new-line characters.
        // https://github.com/ckeditor/ckeditor5/issues/2045.
        if (domEvent.inputType == 'insertText' && data && data.includes('\n')) {
            // There might be a single new-line or double for new paragraph, but we translate
            // it to paragraphs as it is our default action for enter handling.
            const parts = data.split(/\n{1,2}/g);
            let partTargetRanges = targetRanges;
            for (let i = 0; i < parts.length; i++) {
                const dataPart = parts[i];
                if (dataPart != '') {
                    this.fire(domEvent.type, domEvent, {
                        data: dataPart,
                        dataTransfer,
                        targetRanges: partTargetRanges,
                        inputType: domEvent.inputType,
                        isComposing: domEvent.isComposing
                    });
                    // Use the result view selection so following events will be added one after another.
                    partTargetRanges = [viewDocument.selection.getFirstRange()];
                }
                if (i + 1 < parts.length) {
                    this.fire(domEvent.type, domEvent, {
                        inputType: 'insertParagraph',
                        targetRanges: partTargetRanges
                    });
                    // Use the result view selection so following events will be added one after another.
                    partTargetRanges = [viewDocument.selection.getFirstRange()];
                }
            }
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.groupEnd();
            // @if CK_DEBUG_TYPING // }
            return;
        }
        // Fire the normalized beforeInput event.
        this.fire(domEvent.type, domEvent, {
            data,
            dataTransfer,
            targetRanges,
            inputType: domEvent.inputType,
            isComposing: domEvent.isComposing
        });
        // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
        // @if CK_DEBUG_TYPING // 	console.groupEnd();
        // @if CK_DEBUG_TYPING // }
    }
}
