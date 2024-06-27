/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import ButtonView from './buttonview.js';
import type { Locale } from '@ckeditor/ckeditor5-utils';
/**
 * The file dialog button view.
 *
 * This component provides a button that opens the native file selection dialog.
 * It can be used to implement the UI of a file upload feature.
 *
 * ```ts
 * const view = new FileDialogButtonView( locale );
 *
 * view.set( {
 * 	acceptedType: 'image/*',
 * 	allowMultipleFiles: true
 * 	label: t( 'Insert image' ),
 * 	icon: imageIcon,
 * 	tooltip: true
 * } );
 *
 * view.on( 'done', ( evt, files ) => {
 * 	for ( const file of Array.from( files ) ) {
 * 		console.log( 'Selected file', file );
 * 	}
 * } );
 * ```
 */
export default class FileDialogButtonView extends ButtonView {
    /**
     * The button view of the component.
     *
     * @deprecated
     */
    buttonView: ButtonView;
    /**
     * A hidden `<input>` view used to execute file dialog.
     */
    private _fileInputView;
    /**
     * Accepted file types. Can be provided in form of file extensions, media type or one of:
     * * `audio/*`,
     * * `video/*`,
     * * `image/*`.
     *
     * @observable
     */
    acceptedType: string;
    /**
     * Indicates if multiple files can be selected. Defaults to `true`.
     *
     * @observable
     */
    allowMultipleFiles: boolean;
    /**
     * @inheritDoc
     */
    constructor(locale?: Locale);
    /**
     * @inheritDoc
     */
    render(): void;
}
/**
 * Fired when file dialog is closed with file selected.
 *
 * ```ts
 * view.on( 'done', ( evt, files ) => {
 * 	for ( const file of files ) {
 * 		console.log( 'Selected file', file );
 * 	}
 * }
 * ```
 */
export type FileInputViewDoneEvent = {
    name: 'done';
    args: [files: FileList];
};
