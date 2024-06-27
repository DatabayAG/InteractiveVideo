/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { Plugin } from '@ckeditor/ckeditor5-core/dist/index.js';
import { ClipboardPipeline } from '@ckeditor/ckeditor5-clipboard/dist/index.js';
import { UpcastWriter, Matcher, ViewDocument, DomConverter } from '@ckeditor/ckeditor5-engine/dist/index.js';

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/utils
 */ /**
 * Normalizes CSS length value to 'px'.
 *
 * @internal
 */ function convertCssLengthToPx(value) {
    const numericValue = parseFloat(value);
    if (value.endsWith('pt')) {
        // 1pt = 1in / 72
        return toPx(numericValue * 96 / 72);
    } else if (value.endsWith('pc')) {
        // 1pc = 12pt = 1in / 6.
        return toPx(numericValue * 12 * 96 / 72);
    } else if (value.endsWith('in')) {
        // 1in = 2.54cm = 96px
        return toPx(numericValue * 96);
    } else if (value.endsWith('cm')) {
        // 1cm = 96px / 2.54
        return toPx(numericValue * 96 / 2.54);
    } else if (value.endsWith('mm')) {
        // 1mm = 1cm / 10
        return toPx(numericValue / 10 * 96 / 2.54);
    }
    return value;
}
/**
 * Returns true for value with 'px' unit.
 *
 * @internal
 */ function isPx(value) {
    return value !== undefined && value.endsWith('px');
}
/**
 * Returns a rounded 'px' value.
 *
 * @internal
 */ function toPx(value) {
    return value.toFixed(2).replace(/\.?0+$/, '') + 'px';
}

/**
 * Transforms Word specific list-like elements to the semantic HTML lists.
 *
 * Lists in Word are represented by block elements with special attributes like:
 *
 * ```xml
 * <p class=MsoListParagraphCxSpFirst style='mso-list:l1 level1 lfo1'>...</p> // Paragraph based list.
 * <h1 style='mso-list:l0 level1 lfo1'>...</h1> // Heading 1 based list.
 * ```
 *
 * @param documentFragment The view structure to be transformed.
 * @param stylesString Styles from which list-like elements styling will be extracted.
 */ function transformListItemLikeElementsIntoLists(documentFragment, stylesString, hasMultiLevelListPlugin) {
    if (!documentFragment.childCount) {
        return;
    }
    const writer = new UpcastWriter(documentFragment.document);
    const itemLikeElements = findAllItemLikeElements(documentFragment, writer);
    if (!itemLikeElements.length) {
        return;
    }
    const encounteredLists = {};
    const stack = [];
    for (const itemLikeElement of itemLikeElements){
        if (itemLikeElement.indent !== undefined) {
            if (!isListContinuation(itemLikeElement)) {
                stack.length = 0;
            }
            // Combined list ID for addressing encounter lists counters.
            const originalListId = `${itemLikeElement.id}:${itemLikeElement.indent}`;
            // Normalized list item indentation.
            const indent = Math.min(itemLikeElement.indent - 1, stack.length);
            // Trimming of the list stack on list ID change.
            if (indent < stack.length && stack[indent].id !== itemLikeElement.id) {
                stack.length = indent;
            }
            // Trimming of the list stack on lower indent list encountered.
            if (indent < stack.length - 1) {
                stack.length = indent + 1;
            } else {
                const listStyle = detectListStyle(itemLikeElement, stylesString);
                // Create a new OL/UL if required (greater indent or different list type).
                if (indent > stack.length - 1 || stack[indent].listElement.name != listStyle.type) {
                    // Check if there is some start index to set from a previous list.
                    if (indent == 0 && listStyle.type == 'ol' && itemLikeElement.id !== undefined && encounteredLists[originalListId]) {
                        listStyle.startIndex = encounteredLists[originalListId];
                    }
                    const listElement = createNewEmptyList(listStyle, writer, hasMultiLevelListPlugin);
                    // Apply list padding only if we have margins for the item and the parent item.
                    if (isPx(itemLikeElement.marginLeft) && (indent == 0 || isPx(stack[indent - 1].marginLeft))) {
                        let marginLeft = itemLikeElement.marginLeft;
                        if (indent > 0) {
                            // Convert the padding from absolute to relative.
                            marginLeft = toPx(parseFloat(marginLeft) - parseFloat(stack[indent - 1].marginLeft));
                        }
                        writer.setStyle('padding-left', marginLeft, listElement);
                    }
                    // Insert the new OL/UL.
                    if (stack.length == 0) {
                        const parent = itemLikeElement.element.parent;
                        const index = parent.getChildIndex(itemLikeElement.element) + 1;
                        writer.insertChild(index, listElement, parent);
                    } else {
                        const parentListItems = stack[indent - 1].listItemElements;
                        writer.appendChild(listElement, parentListItems[parentListItems.length - 1]);
                    }
                    // Update the list stack for other items to reference.
                    stack[indent] = {
                        ...itemLikeElement,
                        listElement,
                        listItemElements: []
                    };
                    // Prepare list counter for start index.
                    if (indent == 0 && itemLikeElement.id !== undefined) {
                        encounteredLists[originalListId] = listStyle.startIndex || 1;
                    }
                }
            }
            // Use LI if it is already it or create a new LI element.
            // https://github.com/ckeditor/ckeditor5/issues/15964
            const listItem = itemLikeElement.element.name == 'li' ? itemLikeElement.element : writer.createElement('li');
            // Append the LI to OL/UL.
            writer.appendChild(listItem, stack[indent].listElement);
            stack[indent].listItemElements.push(listItem);
            // Increment list counter.
            if (indent == 0 && itemLikeElement.id !== undefined) {
                encounteredLists[originalListId]++;
            }
            // Append list block to LI.
            if (itemLikeElement.element != listItem) {
                writer.appendChild(itemLikeElement.element, listItem);
            }
            // Clean list block.
            removeBulletElement(itemLikeElement.element, writer);
            writer.removeStyle('text-indent', itemLikeElement.element); // #12361
            writer.removeStyle('margin-left', itemLikeElement.element);
        } else {
            // Other blocks in a list item.
            const stackItem = stack.find((stackItem)=>stackItem.marginLeft == itemLikeElement.marginLeft);
            // This might be a paragraph that has known margin, but it is not a real list block.
            if (stackItem) {
                const listItems = stackItem.listItemElements;
                // Append block to LI.
                writer.appendChild(itemLikeElement.element, listItems[listItems.length - 1]);
                writer.removeStyle('margin-left', itemLikeElement.element);
            } else {
                stack.length = 0;
            }
        }
    }
}
/**
 * Removes paragraph wrapping content inside a list item.
 */ function unwrapParagraphInListItem(documentFragment, writer) {
    for (const value of writer.createRangeIn(documentFragment)){
        const element = value.item;
        if (element.is('element', 'li')) {
            // Google Docs allows for single paragraph inside LI.
            const firstChild = element.getChild(0);
            if (firstChild && firstChild.is('element', 'p')) {
                writer.unwrapElement(firstChild);
            }
        }
    }
}
/**
 * Finds all list-like elements in a given document fragment.
 *
 * @param documentFragment Document fragment in which to look for list-like nodes.
 * @returns Array of found list-like items. Each item is an object containing:
 */ function findAllItemLikeElements(documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const itemLikeElements = [];
    const foundMargins = new Set();
    for (const item of range.getItems()){
        // https://github.com/ckeditor/ckeditor5/issues/15964
        if (!item.is('element') || !item.name.match(/^(p|h\d+|li|div)$/)) {
            continue;
        }
        // Try to rely on margin-left style to find paragraphs visually aligned with previously encountered list item.
        let marginLeft = getMarginLeftNormalized(item);
        // Ignore margin-left 0 style if there is no MsoList... class.
        if (marginLeft !== undefined && parseFloat(marginLeft) == 0 && !Array.from(item.getClassNames()).find((className)=>className.startsWith('MsoList'))) {
            marginLeft = undefined;
        }
        // List item or a following list item block.
        if (item.hasStyle('mso-list') || marginLeft !== undefined && foundMargins.has(marginLeft)) {
            const itemData = getListItemData(item);
            itemLikeElements.push({
                element: item,
                id: itemData.id,
                order: itemData.order,
                indent: itemData.indent,
                marginLeft
            });
            if (marginLeft !== undefined) {
                foundMargins.add(marginLeft);
            }
        } else {
            foundMargins.clear();
        }
    }
    return itemLikeElements;
}
/**
 * Whether the given element is possibly a list continuation. Previous element was wrapped into a list
 * or the current element already is inside a list.
 */ function isListContinuation(currentItem) {
    const previousSibling = currentItem.element.previousSibling;
    if (!previousSibling) {
        // If it's a li inside ul or ol like in here: https://github.com/ckeditor/ckeditor5/issues/15964.
        return isList(currentItem.element.parent);
    }
    // Even with the same id the list does not have to be continuous (#43).
    return isList(previousSibling);
}
function isList(element) {
    return element.is('element', 'ol') || element.is('element', 'ul');
}
/**
 * Extracts list item style from the provided CSS.
 *
 * List item style is extracted from the CSS stylesheet. Each list with its specific style attribute
 * value (`mso-list:l1 level1 lfo1`) has its dedicated properties in a CSS stylesheet defined with a selector like:
 *
 * ```css
 * @list l1:level1 { ... }
 * ```
 *
 * It contains `mso-level-number-format` property which defines list numbering/bullet style. If this property
 * is not defined it means default `decimal` numbering.
 *
 * Here CSS string representation is used as `mso-level-number-format` property is an invalid CSS property
 * and will be removed during CSS parsing.
 *
 * @param listLikeItem List-like item for which list style will be searched for. Usually
 * a result of `findAllItemLikeElements()` function.
 * @param stylesString CSS stylesheet.
 * @returns An object with properties:
 *
 * * type - List type, could be `ul` or `ol`.
 * * startIndex - List start index, valid only for ordered lists.
 * * style - List style, for example: `decimal`, `lower-roman`, etc. It is extracted
 *     directly from Word stylesheet and adjusted to represent proper values for the CSS `list-style-type` property.
 *     If it cannot be adjusted, the `null` value is returned.
 */ function detectListStyle(listLikeItem, stylesString) {
    const listStyleRegexp = new RegExp(`@list l${listLikeItem.id}:level${listLikeItem.indent}\\s*({[^}]*)`, 'gi');
    const listStyleTypeRegex = /mso-level-number-format:([^;]{0,100});/gi;
    const listStartIndexRegex = /mso-level-start-at:\s{0,100}([0-9]{0,10})\s{0,100};/gi;
    const legalStyleListRegex = new RegExp(`@list\\s+l${listLikeItem.id}:level\\d\\s*{[^{]*mso-level-text:"%\\d\\\\.`, 'gi');
    const multiLevelNumberFormatTypeRegex = new RegExp(`@list l${listLikeItem.id}:level\\d\\s*{[^{]*mso-level-number-format:`, 'gi');
    const legalStyleListMatch = legalStyleListRegex.exec(stylesString);
    const multiLevelNumberFormatMatch = multiLevelNumberFormatTypeRegex.exec(stylesString);
    // Multi level lists in Word have mso-level-number-format attribute except legal lists,
    // so we used that. If list has legal list match and doesn't has mso-level-number-format
    // then this is legal-list.
    const islegalStyleList = legalStyleListMatch && !multiLevelNumberFormatMatch;
    const listStyleMatch = listStyleRegexp.exec(stylesString);
    let listStyleType = 'decimal'; // Decimal is default one.
    let type = 'ol'; // <ol> is default list.
    let startIndex = null;
    if (listStyleMatch && listStyleMatch[1]) {
        const listStyleTypeMatch = listStyleTypeRegex.exec(listStyleMatch[1]);
        if (listStyleTypeMatch && listStyleTypeMatch[1]) {
            listStyleType = listStyleTypeMatch[1].trim();
            type = listStyleType !== 'bullet' && listStyleType !== 'image' ? 'ol' : 'ul';
        }
        // Styles for the numbered lists are always defined in the Word CSS stylesheet.
        // Unordered lists MAY contain a value for the Word CSS definition `mso-level-text` but sometimes
        // this tag is missing. And because of that, we cannot depend on that. We need to predict the list style value
        // based on the list style marker element.
        if (listStyleType === 'bullet') {
            const bulletedStyle = findBulletedListStyle(listLikeItem.element);
            if (bulletedStyle) {
                listStyleType = bulletedStyle;
            }
        } else {
            const listStartIndexMatch = listStartIndexRegex.exec(listStyleMatch[1]);
            if (listStartIndexMatch && listStartIndexMatch[1]) {
                startIndex = parseInt(listStartIndexMatch[1]);
            }
        }
        if (islegalStyleList) {
            type = 'ol';
        }
    }
    return {
        type,
        startIndex,
        style: mapListStyleDefinition(listStyleType),
        isLegalStyleList: islegalStyleList
    };
}
/**
 * Tries to extract the `list-style-type` value based on the marker element for bulleted list.
 */ function findBulletedListStyle(element) {
    // https://github.com/ckeditor/ckeditor5/issues/15964
    if (element.name == 'li' && element.parent.name == 'ul' && element.parent.hasAttribute('type')) {
        return element.parent.getAttribute('type');
    }
    const listMarkerElement = findListMarkerNode(element);
    if (!listMarkerElement) {
        return null;
    }
    const listMarker = listMarkerElement._data;
    if (listMarker === 'o') {
        return 'circle';
    } else if (listMarker === '·') {
        return 'disc';
    } else if (listMarker === '§') {
        return 'square';
    }
    return null;
}
/**
 * Tries to find a text node that represents the marker element (list-style-type).
 */ function findListMarkerNode(element) {
    // If the first child is a text node, it is the data for the element.
    // The list-style marker is not present here.
    if (element.getChild(0).is('$text')) {
        return null;
    }
    for (const childNode of element.getChildren()){
        // The list-style marker will be inside the `<span>` element. Let's ignore all non-span elements.
        // It may happen that the `<a>` element is added as the first child. Most probably, it's an anchor element.
        if (!childNode.is('element', 'span')) {
            continue;
        }
        const textNodeOrElement = childNode.getChild(0);
        if (!textNodeOrElement) {
            continue;
        }
        // If already found the marker element, use it.
        if (textNodeOrElement.is('$text')) {
            return textNodeOrElement;
        }
        return textNodeOrElement.getChild(0);
    }
    /* istanbul ignore next -- @preserve */ return null;
}
/**
 * Parses the `list-style-type` value extracted directly from the Word CSS stylesheet and returns proper CSS definition.
 */ function mapListStyleDefinition(value) {
    if (value.startsWith('arabic-leading-zero')) {
        return 'decimal-leading-zero';
    }
    switch(value){
        case 'alpha-upper':
            return 'upper-alpha';
        case 'alpha-lower':
            return 'lower-alpha';
        case 'roman-upper':
            return 'upper-roman';
        case 'roman-lower':
            return 'lower-roman';
        case 'circle':
        case 'disc':
        case 'square':
            return value;
        default:
            return null;
    }
}
/**
 * Creates a new list OL/UL element.
 */ function createNewEmptyList(listStyle, writer, hasMultiLevelListPlugin) {
    const list = writer.createElement(listStyle.type);
    // We do not support modifying the marker for a particular list item.
    // Set the value for the `list-style-type` property directly to the list container.
    if (listStyle.style) {
        writer.setStyle('list-style-type', listStyle.style, list);
    }
    if (listStyle.startIndex && listStyle.startIndex > 1) {
        writer.setAttribute('start', listStyle.startIndex, list);
    }
    if (listStyle.isLegalStyleList && hasMultiLevelListPlugin) {
        writer.addClass('legal-list', list);
    }
    return list;
}
/**
 * Extracts list item information from Word specific list-like element style:
 *
 * ```
 * `style="mso-list:l1 level1 lfo1"`
 * ```
 *
 * where:
 *
 * ```
 * * `l1` is a list id (however it does not mean this is a continuous list - see #43),
 * * `level1` is a list item indentation level,
 * * `lfo1` is a list insertion order in a document.
 * ```
 *
 * @param element Element from which style data is extracted.
 */ function getListItemData(element) {
    const listStyle = element.getStyle('mso-list');
    if (listStyle === undefined) {
        return {};
    }
    const idMatch = listStyle.match(/(^|\s{1,100})l(\d+)/i);
    const orderMatch = listStyle.match(/\s{0,100}lfo(\d+)/i);
    const indentMatch = listStyle.match(/\s{0,100}level(\d+)/i);
    if (idMatch && orderMatch && indentMatch) {
        return {
            id: idMatch[2],
            order: orderMatch[1],
            indent: parseInt(indentMatch[1])
        };
    }
    return {
        indent: 1 // Handle empty mso-list style as a marked for default list item.
    };
}
/**
 * Removes span with a numbering/bullet from a given element.
 */ function removeBulletElement(element, writer) {
    // Matcher for finding `span` elements holding lists numbering/bullets.
    const bulletMatcher = new Matcher({
        name: 'span',
        styles: {
            'mso-list': 'Ignore'
        }
    });
    const range = writer.createRangeIn(element);
    for (const value of range){
        if (value.type === 'elementStart' && bulletMatcher.match(value.item)) {
            writer.remove(value.item);
        }
    }
}
/**
 * Returns element left margin normalized to 'px' if possible.
 */ function getMarginLeftNormalized(element) {
    const value = element.getStyle('margin-left');
    if (value === undefined || value.endsWith('px')) {
        return value;
    }
    return convertCssLengthToPx(value);
}

/**
 * Replaces source attribute of all `<img>` elements representing regular
 * images (not the Word shapes) with inlined base64 image representation extracted from RTF or Blob data.
 *
 * @param documentFragment Document fragment on which transform images.
 * @param rtfData The RTF data from which images representation will be used.
 */ function replaceImagesSourceWithBase64(documentFragment, rtfData) {
    if (!documentFragment.childCount) {
        return;
    }
    const upcastWriter = new UpcastWriter(documentFragment.document);
    const shapesIds = findAllShapesIds(documentFragment, upcastWriter);
    removeAllImgElementsRepresentingShapes(shapesIds, documentFragment, upcastWriter);
    insertMissingImgs(shapesIds, documentFragment, upcastWriter);
    removeAllShapeElements(documentFragment, upcastWriter);
    const images = findAllImageElementsWithLocalSource(documentFragment, upcastWriter);
    if (images.length) {
        replaceImagesFileSourceWithInlineRepresentation(images, extractImageDataFromRtf(rtfData), upcastWriter);
    }
}
/**
 * Converts given HEX string to base64 representation.
 *
 * @internal
 * @param hexString The HEX string to be converted.
 * @returns Base64 representation of a given HEX string.
 */ function _convertHexToBase64(hexString) {
    return btoa(hexString.match(/\w{2}/g).map((char)=>{
        return String.fromCharCode(parseInt(char, 16));
    }).join(''));
}
/**
 * Finds all shapes (`<v:*>...</v:*>`) ids. Shapes can represent images (canvas)
 * or Word shapes (which does not have RTF or Blob representation).
 *
 * @param documentFragment Document fragment from which to extract shape ids.
 * @returns Array of shape ids.
 */ function findAllShapesIds(documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const shapeElementsMatcher = new Matcher({
        name: /v:(.+)/
    });
    const shapesIds = [];
    for (const value of range){
        if (value.type != 'elementStart') {
            continue;
        }
        const el = value.item;
        const previousSibling = el.previousSibling;
        const prevSiblingName = previousSibling && previousSibling.is('element') ? previousSibling.name : null;
        // List of ids which should not be considered as shapes.
        // https://github.com/ckeditor/ckeditor5/pull/15847#issuecomment-1941543983
        const exceptionIds = [
            'Chart'
        ];
        const isElementAShape = shapeElementsMatcher.match(el);
        const hasElementGfxdataAttribute = el.getAttribute('o:gfxdata');
        const isPreviousSiblingAShapeType = prevSiblingName === 'v:shapetype';
        const isElementIdInExceptionsArray = hasElementGfxdataAttribute && exceptionIds.some((item)=>el.getAttribute('id').includes(item));
        // If shape element has 'o:gfxdata' attribute and is not directly before
        // `<v:shapetype>` element it means that it represents a Word shape.
        if (isElementAShape && hasElementGfxdataAttribute && !isPreviousSiblingAShapeType && !isElementIdInExceptionsArray) {
            shapesIds.push(value.item.getAttribute('id'));
        }
    }
    return shapesIds;
}
/**
 * Removes all `<img>` elements which represents Word shapes and not regular images.
 *
 * @param shapesIds Shape ids which will be checked against `<img>` elements.
 * @param documentFragment Document fragment from which to remove `<img>` elements.
 */ function removeAllImgElementsRepresentingShapes(shapesIds, documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const imageElementsMatcher = new Matcher({
        name: 'img'
    });
    const imgs = [];
    for (const value of range){
        if (value.item.is('element') && imageElementsMatcher.match(value.item)) {
            const el = value.item;
            const shapes = el.getAttribute('v:shapes') ? el.getAttribute('v:shapes').split(' ') : [];
            if (shapes.length && shapes.every((shape)=>shapesIds.indexOf(shape) > -1)) {
                imgs.push(el);
            // Shapes may also have empty source while content is paste in some browsers (Safari).
            } else if (!el.getAttribute('src')) {
                imgs.push(el);
            }
        }
    }
    for (const img of imgs){
        writer.remove(img);
    }
}
/**
 * Removes all shape elements (`<v:*>...</v:*>`) so they do not pollute the output structure.
 *
 * @param documentFragment Document fragment from which to remove shape elements.
 */ function removeAllShapeElements(documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const shapeElementsMatcher = new Matcher({
        name: /v:(.+)/
    });
    const shapes = [];
    for (const value of range){
        if (value.type == 'elementStart' && shapeElementsMatcher.match(value.item)) {
            shapes.push(value.item);
        }
    }
    for (const shape of shapes){
        writer.remove(shape);
    }
}
/**
 * Inserts `img` tags if there is none after a shape.
 */ function insertMissingImgs(shapeIds, documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const shapes = [];
    for (const value of range){
        if (value.type == 'elementStart' && value.item.is('element', 'v:shape')) {
            const id = value.item.getAttribute('id');
            if (shapeIds.includes(id)) {
                continue;
            }
            if (!containsMatchingImg(value.item.parent.getChildren(), id)) {
                shapes.push(value.item);
            }
        }
    }
    for (const shape of shapes){
        const attrs = {
            src: findSrc(shape)
        };
        if (shape.hasAttribute('alt')) {
            attrs.alt = shape.getAttribute('alt');
        }
        const img = writer.createElement('img', attrs);
        writer.insertChild(shape.index + 1, img, shape.parent);
    }
    function containsMatchingImg(nodes, id) {
        for (const node of nodes){
            /* istanbul ignore else -- @preserve */ if (node.is('element')) {
                if (node.name == 'img' && node.getAttribute('v:shapes') == id) {
                    return true;
                }
                if (containsMatchingImg(node.getChildren(), id)) {
                    return true;
                }
            }
        }
        return false;
    }
    function findSrc(shape) {
        for (const child of shape.getChildren()){
            /* istanbul ignore else -- @preserve */ if (child.is('element') && child.getAttribute('src')) {
                return child.getAttribute('src');
            }
        }
    }
}
/**
 * Finds all `<img>` elements in a given document fragment which have source pointing to local `file://` resource.
 *
 * @param documentFragment Document fragment in which to look for `<img>` elements.
 * @returns result All found images grouped by source type.
 */ function findAllImageElementsWithLocalSource(documentFragment, writer) {
    const range = writer.createRangeIn(documentFragment);
    const imageElementsMatcher = new Matcher({
        name: 'img'
    });
    const imgs = [];
    for (const value of range){
        if (value.item.is('element') && imageElementsMatcher.match(value.item)) {
            if (value.item.getAttribute('src').startsWith('file://')) {
                imgs.push(value.item);
            }
        }
    }
    return imgs;
}
/**
 * Extracts all images HEX representations from a given RTF data.
 *
 * @param rtfData The RTF data from which to extract images HEX representation.
 * @returns Array of found HEX representations. Each array item is an object containing:
 *
 * * hex Image representation in HEX format.
 * * type Type of image, `image/png` or `image/jpeg`.
 */ function extractImageDataFromRtf(rtfData) {
    if (!rtfData) {
        return [];
    }
    const regexPictureHeader = /{\\pict[\s\S]+?\\bliptag-?\d+(\\blipupi-?\d+)?({\\\*\\blipuid\s?[\da-fA-F]+)?[\s}]*?/;
    const regexPicture = new RegExp('(?:(' + regexPictureHeader.source + '))([\\da-fA-F\\s]+)\\}', 'g');
    const images = rtfData.match(regexPicture);
    const result = [];
    if (images) {
        for (const image of images){
            let imageType = false;
            if (image.includes('\\pngblip')) {
                imageType = 'image/png';
            } else if (image.includes('\\jpegblip')) {
                imageType = 'image/jpeg';
            }
            if (imageType) {
                result.push({
                    hex: image.replace(regexPictureHeader, '').replace(/[^\da-fA-F]/g, ''),
                    type: imageType
                });
            }
        }
    }
    return result;
}
/**
 * Replaces `src` attribute value of all given images with the corresponding base64 image representation.
 *
 * @param imageElements Array of image elements which will have its source replaced.
 * @param imagesHexSources Array of images hex sources (usually the result of `extractImageDataFromRtf()` function).
 * The array should be the same length as `imageElements` parameter.
 */ function replaceImagesFileSourceWithInlineRepresentation(imageElements, imagesHexSources, writer) {
    // Assume there is an equal amount of image elements and images HEX sources so they can be matched accordingly based on existing order.
    if (imageElements.length === imagesHexSources.length) {
        for(let i = 0; i < imageElements.length; i++){
            const newSrc = `data:${imagesHexSources[i].type};base64,${_convertHexToBase64(imagesHexSources[i].hex)}`;
            writer.setAttribute('src', newSrc, imageElements[i]);
        }
    }
}

/**
 * Cleanup MS attributes like styles, attributes and elements.
 *
 * @param documentFragment element `data.content` obtained from clipboard.
 */ function removeMSAttributes(documentFragment) {
    const elementsToUnwrap = [];
    const writer = new UpcastWriter(documentFragment.document);
    for (const { item } of writer.createRangeIn(documentFragment)){
        if (!item.is('element')) {
            continue;
        }
        for (const className of item.getClassNames()){
            if (/\bmso/gi.exec(className)) {
                writer.removeClass(className, item);
            }
        }
        for (const styleName of item.getStyleNames()){
            if (/\bmso/gi.exec(styleName)) {
                writer.removeStyle(styleName, item);
            }
        }
        if (item.is('element', 'w:sdt') || item.is('element', 'w:sdtpr') && item.isEmpty || item.is('element', 'o:p') && item.isEmpty) {
            elementsToUnwrap.push(item);
        }
    }
    for (const item of elementsToUnwrap){
        const itemParent = item.parent;
        const childIndex = itemParent.getChildIndex(item);
        writer.insertChild(childIndex, item.getChildren(), itemParent);
        writer.remove(item);
    }
}

const msWordMatch1 = /<meta\s*name="?generator"?\s*content="?microsoft\s*word\s*\d+"?\/?>/i;
const msWordMatch2 = /xmlns:o="urn:schemas-microsoft-com/i;
/**
 * Normalizer for the content pasted from Microsoft Word.
 */ class MSWordNormalizer {
    document;
    hasMultiLevelListPlugin;
    /**
	 * Creates a new `MSWordNormalizer` instance.
	 *
	 * @param document View document.
	 */ constructor(document, hasMultiLevelListPlugin = false){
        this.document = document;
        this.hasMultiLevelListPlugin = hasMultiLevelListPlugin;
    }
    /**
	 * @inheritDoc
	 */ isActive(htmlString) {
        return msWordMatch1.test(htmlString) || msWordMatch2.test(htmlString);
    }
    /**
	 * @inheritDoc
	 */ execute(data) {
        const { body: documentFragment, stylesString } = data._parsedData;
        transformListItemLikeElementsIntoLists(documentFragment, stylesString, this.hasMultiLevelListPlugin);
        replaceImagesSourceWithBase64(documentFragment, data.dataTransfer.getData('text/rtf'));
        removeMSAttributes(documentFragment);
        data.content = documentFragment;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/removeboldwrapper
 */ /**
 * Removes the `<b>` tag wrapper added by Google Docs to a copied content.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */ function removeBoldWrapper(documentFragment, writer) {
    for (const child of documentFragment.getChildren()){
        if (child.is('element', 'b') && child.getStyle('font-weight') === 'normal') {
            const childIndex = documentFragment.getChildIndex(child);
            writer.remove(child);
            writer.insertChild(childIndex, child.getChildren(), documentFragment);
        }
    }
}

/**
 * Transforms `<br>` elements that are siblings to some block element into a paragraphs.
 *
 * @param documentFragment The view structure to be transformed.
 */ function transformBlockBrsToParagraphs(documentFragment, writer) {
    const viewDocument = new ViewDocument(writer.document.stylesProcessor);
    const domConverter = new DomConverter(viewDocument, {
        renderingMode: 'data'
    });
    const blockElements = domConverter.blockElements;
    const inlineObjectElements = domConverter.inlineObjectElements;
    const elementsToReplace = [];
    for (const value of writer.createRangeIn(documentFragment)){
        const element = value.item;
        if (element.is('element', 'br')) {
            const nextSibling = findSibling(element, 'forward', writer, {
                blockElements,
                inlineObjectElements
            });
            const previousSibling = findSibling(element, 'backward', writer, {
                blockElements,
                inlineObjectElements
            });
            const nextSiblingIsBlock = isBlockViewElement(nextSibling, blockElements);
            const previousSiblingIsBlock = isBlockViewElement(previousSibling, blockElements);
            // If the <br> is surrounded by blocks then convert it to a paragraph:
            // * <p>foo</p>[<br>]<p>bar</p> -> <p>foo</p>[<p></p>]<p>bar</p>
            // * <p>foo</p>[<br>] -> <p>foo</p>[<p></p>]
            // * [<br>]<p>foo</p> -> [<p></p>]<p>foo</p>
            if (previousSiblingIsBlock || nextSiblingIsBlock) {
                elementsToReplace.push(element);
            }
        }
    }
    for (const element of elementsToReplace){
        if (element.hasClass('Apple-interchange-newline')) {
            writer.remove(element);
        } else {
            writer.replace(element, writer.createElement('p'));
        }
    }
}
/**
 * Returns sibling node, threats inline elements as transparent (but should stop on an inline objects).
 */ function findSibling(viewElement, direction, writer, { blockElements, inlineObjectElements }) {
    let position = writer.createPositionAt(viewElement, direction == 'forward' ? 'after' : 'before');
    // Find first position that is just before a first:
    // * text node,
    // * block element,
    // * inline object element.
    // It's ignoring any inline (non-object) elements like span, strong, etc.
    position = position.getLastMatchingPosition(({ item })=>item.is('element') && !blockElements.includes(item.name) && !inlineObjectElements.includes(item.name), {
        direction
    });
    return direction == 'forward' ? position.nodeAfter : position.nodeBefore;
}
/**
 * Returns true for view elements that are listed as block view elements.
 */ function isBlockViewElement(node, blockElements) {
    return !!node && node.is('element') && blockElements.includes(node.name);
}

const googleDocsMatch = /id=("|')docs-internal-guid-[-0-9a-f]+("|')/i;
/**
 * Normalizer for the content pasted from Google Docs.
 */ class GoogleDocsNormalizer {
    document;
    /**
	 * Creates a new `GoogleDocsNormalizer` instance.
	 *
	 * @param document View document.
	 */ constructor(document){
        this.document = document;
    }
    /**
	 * @inheritDoc
	 */ isActive(htmlString) {
        return googleDocsMatch.test(htmlString);
    }
    /**
	 * @inheritDoc
	 */ execute(data) {
        const writer = new UpcastWriter(this.document);
        const { body: documentFragment } = data._parsedData;
        removeBoldWrapper(documentFragment, writer);
        unwrapParagraphInListItem(documentFragment, writer);
        transformBlockBrsToParagraphs(documentFragment, writer);
        data.content = documentFragment;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/removexmlns
 */ /**
 * Removes the `xmlns` attribute from table pasted from Google Sheets.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */ function removeXmlns(documentFragment, writer) {
    for (const child of documentFragment.getChildren()){
        if (child.is('element', 'table') && child.hasAttribute('xmlns')) {
            writer.removeAttribute('xmlns', child);
        }
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/removegooglesheetstag
 */ /**
 * Removes the `<google-sheets-html-origin>` tag wrapper added by Google Sheets to a copied content.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */ function removeGoogleSheetsTag(documentFragment, writer) {
    for (const child of documentFragment.getChildren()){
        if (child.is('element', 'google-sheets-html-origin')) {
            const childIndex = documentFragment.getChildIndex(child);
            writer.remove(child);
            writer.insertChild(childIndex, child.getChildren(), documentFragment);
        }
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/removeinvalidtablewidth
 */ /**
 * Removes the `width:0px` style from table pasted from Google Sheets.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */ function removeInvalidTableWidth(documentFragment, writer) {
    for (const child of documentFragment.getChildren()){
        if (child.is('element', 'table') && child.getStyle('width') === '0px') {
            writer.removeStyle('width', child);
        }
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/removestyleblock
 */ /**
 * Removes `<style>` block added by Google Sheets to a copied content.
 *
 * @param documentFragment element `data.content` obtained from clipboard
 */ function removeStyleBlock(documentFragment, writer) {
    for (const child of Array.from(documentFragment.getChildren())){
        if (child.is('element', 'style')) {
            writer.remove(child);
        }
    }
}

const googleSheetsMatch = /<google-sheets-html-origin/i;
/**
 * Normalizer for the content pasted from Google Sheets.
 */ class GoogleSheetsNormalizer {
    document;
    /**
	 * Creates a new `GoogleSheetsNormalizer` instance.
	 *
	 * @param document View document.
	 */ constructor(document){
        this.document = document;
    }
    /**
	 * @inheritDoc
	 */ isActive(htmlString) {
        return googleSheetsMatch.test(htmlString);
    }
    /**
	 * @inheritDoc
	 */ execute(data) {
        const writer = new UpcastWriter(this.document);
        const { body: documentFragment } = data._parsedData;
        removeGoogleSheetsTag(documentFragment, writer);
        removeXmlns(documentFragment, writer);
        removeInvalidTableWidth(documentFragment, writer);
        removeStyleBlock(documentFragment, writer);
        data.content = documentFragment;
    }
}

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */ /**
 * @module paste-from-office/filters/space
 */ /**
 * Replaces last space preceding elements closing tag with `&nbsp;`. Such operation prevents spaces from being removed
 * during further DOM/View processing (see especially {@link module:engine/view/domconverter~DomConverter#_processDomInlineNodes}).
 * This method also takes into account Word specific `<o:p></o:p>` empty tags.
 * Additionally multiline sequences of spaces and new lines between tags are removed (see #39 and #40).
 *
 * @param htmlString HTML string in which spacing should be normalized.
 * @returns Input HTML with spaces normalized.
 */ function normalizeSpacing(htmlString) {
    // Run normalizeSafariSpaceSpans() two times to cover nested spans.
    return normalizeSafariSpaceSpans(normalizeSafariSpaceSpans(htmlString))// Remove all \r\n from "spacerun spans" so the last replace line doesn't strip all whitespaces.
    .replace(/(<span\s+style=['"]mso-spacerun:yes['"]>[^\S\r\n]*?)[\r\n]+([^\S\r\n]*<\/span>)/g, '$1$2').replace(/<span\s+style=['"]mso-spacerun:yes['"]><\/span>/g, '').replace(/(<span\s+style=['"]letter-spacing:[^'"]+?['"]>)[\r\n]+(<\/span>)/g, '$1 $2').replace(/ <\//g, '\u00A0</').replace(/ <o:p><\/o:p>/g, '\u00A0<o:p></o:p>')// Remove <o:p> block filler from empty paragraph. Safari uses \u00A0 instead of &nbsp;.
    .replace(/<o:p>(&nbsp;|\u00A0)<\/o:p>/g, '')// Remove all whitespaces when they contain any \r or \n.
    .replace(/>([^\S\r\n]*[\r\n]\s*)</g, '><');
}
/**
 * Normalizes spacing in special Word `spacerun spans` (`<span style='mso-spacerun:yes'>\s+</span>`) by replacing
 * all spaces with `&nbsp; ` pairs. This prevents spaces from being removed during further DOM/View processing
 * (see especially {@link module:engine/view/domconverter~DomConverter#_processDomInlineNodes}).
 *
 * @param htmlDocument Native `Document` object in which spacing should be normalized.
 */ function normalizeSpacerunSpans(htmlDocument) {
    htmlDocument.querySelectorAll('span[style*=spacerun]').forEach((el)=>{
        const htmlElement = el;
        const innerTextLength = htmlElement.innerText.length || 0;
        htmlElement.innerText = Array(innerTextLength + 1).join('\u00A0 ').substr(0, innerTextLength);
    });
}
/**
 * Normalizes specific spacing generated by Safari when content pasted from Word (`<span class="Apple-converted-space"> </span>`)
 * by replacing all spaces sequences longer than 1 space with `&nbsp; ` pairs. This prevents spaces from being removed during
 * further DOM/View processing (see especially {@link module:engine/view/domconverter~DomConverter#_processDataFromDomText}).
 *
 * This function is similar to {@link module:clipboard/utils/normalizeclipboarddata normalizeClipboardData util} but uses
 * regular spaces / &nbsp; sequence for replacement.
 *
 * @param htmlString HTML string in which spacing should be normalized
 * @returns Input HTML with spaces normalized.
 */ function normalizeSafariSpaceSpans(htmlString) {
    return htmlString.replace(/<span(?: class="Apple-converted-space"|)>(\s+)<\/span>/g, (fullMatch, spaces)=>{
        return spaces.length === 1 ? ' ' : Array(spaces.length + 1).join('\u00A0 ').substr(0, spaces.length);
    });
}

/**
 * Parses the provided HTML extracting contents of `<body>` and `<style>` tags.
 *
 * @param htmlString HTML string to be parsed.
 */ function parseHtml(htmlString, stylesProcessor) {
    const domParser = new DOMParser();
    // Remove Word specific "if comments" so content inside is not omitted by the parser.
    htmlString = htmlString.replace(/<!--\[if gte vml 1]>/g, '');
    // Clean the <head> section of MS Windows specific tags. See https://github.com/ckeditor/ckeditor5/issues/15333.
    // The regular expression matches the <o:SmartTagType> tag with optional attributes (with or without values).
    htmlString = htmlString.replace(/<o:SmartTagType(?:\s+[^\s>=]+(?:="[^"]*")?)*\s*\/?>/gi, '');
    const normalizedHtml = normalizeSpacing(cleanContentAfterBody(htmlString));
    // Parse htmlString as native Document object.
    const htmlDocument = domParser.parseFromString(normalizedHtml, 'text/html');
    normalizeSpacerunSpans(htmlDocument);
    // Get `innerHTML` first as transforming to View modifies the source document.
    const bodyString = htmlDocument.body.innerHTML;
    // Transform document.body to View.
    const bodyView = documentToView(htmlDocument, stylesProcessor);
    // Extract stylesheets.
    const stylesObject = extractStyles(htmlDocument);
    return {
        body: bodyView,
        bodyString,
        styles: stylesObject.styles,
        stylesString: stylesObject.stylesString
    };
}
/**
 * Transforms native `Document` object into {@link module:engine/view/documentfragment~DocumentFragment}. Comments are skipped.
 *
 * @param htmlDocument Native `Document` object to be transformed.
 */ function documentToView(htmlDocument, stylesProcessor) {
    const viewDocument = new ViewDocument(stylesProcessor);
    const domConverter = new DomConverter(viewDocument, {
        renderingMode: 'data'
    });
    const fragment = htmlDocument.createDocumentFragment();
    const nodes = htmlDocument.body.childNodes;
    while(nodes.length > 0){
        fragment.appendChild(nodes[0]);
    }
    return domConverter.domToView(fragment, {
        skipComments: true
    });
}
/**
 * Extracts both `CSSStyleSheet` and string representation from all `style` elements available in a provided `htmlDocument`.
 *
 * @param htmlDocument Native `Document` object from which styles will be extracted.
 */ function extractStyles(htmlDocument) {
    const styles = [];
    const stylesString = [];
    const styleTags = Array.from(htmlDocument.getElementsByTagName('style'));
    for (const style of styleTags){
        if (style.sheet && style.sheet.cssRules && style.sheet.cssRules.length) {
            styles.push(style.sheet);
            stylesString.push(style.innerHTML);
        }
    }
    return {
        styles,
        stylesString: stylesString.join(' ')
    };
}
/**
 * Removes leftover content from between closing </body> and closing </html> tag:
 *
 * ```html
 * <html><body><p>Foo Bar</p></body><span>Fo</span></html> -> <html><body><p>Foo Bar</p></body></html>
 * ```
 *
 * This function is used as specific browsers (Edge) add some random content after `body` tag when pasting from Word.
 * @param htmlString The HTML string to be cleaned.
 * @returns The HTML string with leftover content removed.
 */ function cleanContentAfterBody(htmlString) {
    const bodyCloseTag = '</body>';
    const htmlCloseTag = '</html>';
    const bodyCloseIndex = htmlString.indexOf(bodyCloseTag);
    if (bodyCloseIndex < 0) {
        return htmlString;
    }
    const htmlCloseIndex = htmlString.indexOf(htmlCloseTag, bodyCloseIndex + bodyCloseTag.length);
    return htmlString.substring(0, bodyCloseIndex + bodyCloseTag.length) + (htmlCloseIndex >= 0 ? htmlString.substring(htmlCloseIndex) : '');
}

/**
 * The Paste from Office plugin.
 *
 * This plugin handles content pasted from Office apps and transforms it (if necessary)
 * to a valid structure which can then be understood by the editor features.
 *
 * Transformation is made by a set of predefined {@link module:paste-from-office/normalizer~Normalizer normalizers}.
 * This plugin includes following normalizers:
 * * {@link module:paste-from-office/normalizers/mswordnormalizer~MSWordNormalizer Microsoft Word normalizer}
 * * {@link module:paste-from-office/normalizers/googledocsnormalizer~GoogleDocsNormalizer Google Docs normalizer}
 *
 * For more information about this feature check the {@glink api/paste-from-office package page}.
 */ class PasteFromOffice extends Plugin {
    /**
	 * @inheritDoc
	 */ static get pluginName() {
        return 'PasteFromOffice';
    }
    /**
	 * @inheritDoc
	 */ static get requires() {
        return [
            ClipboardPipeline
        ];
    }
    /**
	 * @inheritDoc
	 */ init() {
        const editor = this.editor;
        const clipboardPipeline = editor.plugins.get('ClipboardPipeline');
        const viewDocument = editor.editing.view.document;
        const normalizers = [];
        const hasMultiLevelListPlugin = this.editor.plugins.has('MultiLevelList');
        normalizers.push(new MSWordNormalizer(viewDocument, hasMultiLevelListPlugin));
        normalizers.push(new GoogleDocsNormalizer(viewDocument));
        normalizers.push(new GoogleSheetsNormalizer(viewDocument));
        clipboardPipeline.on('inputTransformation', (evt, data)=>{
            if (data._isTransformedWithPasteFromOffice) {
                return;
            }
            const codeBlock = editor.model.document.selection.getFirstPosition().parent;
            if (codeBlock.is('element', 'codeBlock')) {
                return;
            }
            const htmlString = data.dataTransfer.getData('text/html');
            const activeNormalizer = normalizers.find((normalizer)=>normalizer.isActive(htmlString));
            if (activeNormalizer) {
                if (!data._parsedData) {
                    data._parsedData = parseHtml(htmlString, viewDocument.stylesProcessor);
                }
                activeNormalizer.execute(data);
                data._isTransformedWithPasteFromOffice = true;
            }
        }, {
            priority: 'high'
        });
    }
}

export { MSWordNormalizer, PasteFromOffice, parseHtml };
//# sourceMappingURL=index.js.map
