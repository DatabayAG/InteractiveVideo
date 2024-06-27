/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
/**
 * @module engine
 */
export * from './view/placeholder.js';
// Controller.
export { default as EditingController } from './controller/editingcontroller.js';
export { default as DataController } from './controller/datacontroller.js';
// Conversion.
export { default as Conversion } from './conversion/conversion.js';
export { default as HtmlDataProcessor } from './dataprocessor/htmldataprocessor.js';
export { default as XmlDataProcessor } from './dataprocessor/xmldataprocessor.js';
export { default as InsertOperation } from './model/operation/insertoperation.js';
export { default as MoveOperation } from './model/operation/moveoperation.js';
export { default as MergeOperation } from './model/operation/mergeoperation.js';
export { default as SplitOperation } from './model/operation/splitoperation.js';
export { default as MarkerOperation } from './model/operation/markeroperation.js';
export { default as OperationFactory } from './model/operation/operationfactory.js';
export { default as AttributeOperation } from './model/operation/attributeoperation.js';
export { default as RenameOperation } from './model/operation/renameoperation.js';
export { default as RootAttributeOperation } from './model/operation/rootattributeoperation.js';
export { default as RootOperation } from './model/operation/rootoperation.js';
export { default as NoOperation } from './model/operation/nooperation.js';
export { transformSets } from './model/operation/transform.js';
// Model.
export { default as DocumentSelection } from './model/documentselection.js';
export { default as Range } from './model/range.js';
export { default as LiveRange } from './model/liverange.js';
export { default as LivePosition } from './model/liveposition.js';
export { default as Model } from './model/model.js';
export { default as TreeWalker } from './model/treewalker.js';
export { default as Element } from './model/element.js';
export { default as Position } from './model/position.js';
export { default as DocumentFragment } from './model/documentfragment.js';
export { default as History } from './model/history.js';
export { default as Text } from './model/text.js';
export { default as TextProxy } from './model/textproxy.js';
// View.
export { default as DataTransfer } from './view/datatransfer.js';
export { default as DomConverter } from './view/domconverter.js';
export { default as Renderer } from './view/renderer.js';
export { default as EditingView } from './view/view.js';
export { default as ViewDocument } from './view/document.js';
export { default as ViewText } from './view/text.js';
export { default as ViewElement } from './view/element.js';
export { default as ViewContainerElement } from './view/containerelement.js';
export { default as ViewEditableElement } from './view/editableelement.js';
export { default as ViewRootEditableElement } from './view/rooteditableelement.js';
export { default as ViewAttributeElement } from './view/attributeelement.js';
export { default as ViewEmptyElement } from './view/emptyelement.js';
export { default as ViewRawElement } from './view/rawelement.js';
export { default as ViewUIElement } from './view/uielement.js';
export { default as ViewDocumentFragment } from './view/documentfragment.js';
export { default as ViewTreeWalker } from './view/treewalker.js';
export { default as AttributeElement } from './view/attributeelement.js';
export { getFillerOffset } from './view/containerelement.js';
// View / Observer.
export { default as Observer } from './view/observer/observer.js';
export { default as ClickObserver } from './view/observer/clickobserver.js';
export { default as DomEventObserver } from './view/observer/domeventobserver.js';
export { default as MouseObserver } from './view/observer/mouseobserver.js';
export { default as TabObserver } from './view/observer/tabobserver.js';
export { default as FocusObserver } from './view/observer/focusobserver.js';
export { default as DowncastWriter } from './view/downcastwriter.js';
export { default as UpcastWriter } from './view/upcastwriter.js';
export { default as Matcher } from './view/matcher.js';
export { default as BubblingEventInfo } from './view/observer/bubblingeventinfo.js';
export { default as DomEventData } from './view/observer/domeventdata.js';
// View / Styles.
export { default as StylesMap, StylesProcessor } from './view/stylesmap.js';
export * from './view/styles/background.js';
export * from './view/styles/border.js';
export * from './view/styles/margin.js';
export * from './view/styles/padding.js';
export * from './view/styles/utils.js';
// Development / testing utils.
export { getData as _getModelData, setData as _setModelData, parse as _parseModel, stringify as _stringifyModel } from './dev-utils/model.js';
export { getData as _getViewData, setData as _setViewData, parse as _parseView, stringify as _stringifyView } from './dev-utils/view.js';
