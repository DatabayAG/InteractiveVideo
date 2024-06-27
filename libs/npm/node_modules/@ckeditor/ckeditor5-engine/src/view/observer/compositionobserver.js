/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine/view/observer/compositionobserver
 */
import DomEventObserver from './domeventobserver.js';
/**
 * {@link module:engine/view/document~Document#event:compositionstart Compositionstart},
 * {@link module:engine/view/document~Document#event:compositionupdate compositionupdate} and
 * {@link module:engine/view/document~Document#event:compositionend compositionend} events observer.
 *
 * Note that this observer is attached by the {@link module:engine/view/view~View} and is available by default.
 */
export default class CompositionObserver extends DomEventObserver {
    /**
     * @inheritDoc
     */
    constructor(view) {
        super(view);
        /**
         * @inheritDoc
         */
        this.domEventType = ['compositionstart', 'compositionupdate', 'compositionend'];
        const document = this.document;
        document.on('compositionstart', () => {
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.log( '%c[CompositionObserver] ' +
            // @if CK_DEBUG_TYPING // 		'┌───────────────────────────── isComposing = true ─────────────────────────────┐',
            // @if CK_DEBUG_TYPING // 		'font-weight: bold; color: green'
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
            document.isComposing = true;
        }, { priority: 'low' });
        document.on('compositionend', () => {
            // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
            // @if CK_DEBUG_TYPING // 	console.log( '%c[CompositionObserver] ' +
            // @if CK_DEBUG_TYPING // 		'└───────────────────────────── isComposing = false ─────────────────────────────┘',
            // @if CK_DEBUG_TYPING // 		'font-weight: bold; color: green'
            // @if CK_DEBUG_TYPING // 	);
            // @if CK_DEBUG_TYPING // }
            document.isComposing = false;
        }, { priority: 'low' });
    }
    /**
     * @inheritDoc
     */
    onDomEvent(domEvent) {
        // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
        // @if CK_DEBUG_TYPING // 	console.group( `%c[CompositionObserver]%c ${ domEvent.type }`, 'color: green', '' );
        // @if CK_DEBUG_TYPING // }
        this.fire(domEvent.type, domEvent, {
            data: domEvent.data
        });
        // @if CK_DEBUG_TYPING // if ( ( window as any ).logCKETyping ) {
        // @if CK_DEBUG_TYPING // 	console.groupEnd();
        // @if CK_DEBUG_TYPING // }
    }
}
