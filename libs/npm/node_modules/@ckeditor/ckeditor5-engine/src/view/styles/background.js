/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { getShorthandValues, isAttachment, isColor, isPosition, isRepeat, isURL } from './utils.js';
/**
 * Adds a background CSS styles processing rules.
 *
 * ```ts
 * editor.data.addStyleProcessorRules( addBackgroundRules );
 * ```
 *
 * The normalized value is stored as:
 *
 * ```ts
 * const styles = {
 * 	background: {
 * 		color,
 * 		repeat,
 * 		position,
 * 		attachment,
 * 		image
 * 	}
 * };
 * ````
 *
 * **Note**: Currently only `'background-color'` longhand value is parsed besides `'background'` shorthand. The reducer also supports only
 * `'background-color'` value.
 */
export function addBackgroundRules(stylesProcessor) {
    stylesProcessor.setNormalizer('background', getBackgroundNormalizer());
    stylesProcessor.setNormalizer('background-color', getBackgroundColorNormalizer());
    stylesProcessor.setReducer('background', getBackgroundReducer());
    stylesProcessor.setStyleRelation('background', ['background-color']);
}
function getBackgroundNormalizer() {
    return value => {
        const background = {};
        const parts = getShorthandValues(value);
        for (const part of parts) {
            if (isRepeat(part)) {
                background.repeat = background.repeat || [];
                background.repeat.push(part);
            }
            else if (isPosition(part)) {
                background.position = background.position || [];
                background.position.push(part);
            }
            else if (isAttachment(part)) {
                background.attachment = part;
            }
            else if (isColor(part)) {
                background.color = part;
            }
            else if (isURL(part)) {
                background.image = part;
            }
        }
        return {
            path: 'background',
            value: background
        };
    };
}
function getBackgroundColorNormalizer() {
    return value => ({ path: 'background.color', value });
}
function getBackgroundReducer() {
    return value => {
        const ret = [];
        ret.push(['background-color', value.color]);
        return ret;
    };
}
