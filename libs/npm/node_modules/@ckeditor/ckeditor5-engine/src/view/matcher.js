/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { isPlainObject } from 'lodash-es';
import { logWarning } from '@ckeditor/ckeditor5-utils';
/**
 * View matcher class.
 * Instance of this class can be used to find {@link module:engine/view/element~Element elements} that match given pattern.
 */
export default class Matcher {
    /**
     * Creates new instance of Matcher.
     *
     * @param pattern Match patterns. See {@link module:engine/view/matcher~Matcher#add add method} for more information.
     */
    constructor(...pattern) {
        this._patterns = [];
        this.add(...pattern);
    }
    /**
     * Adds pattern or patterns to matcher instance.
     *
     * ```ts
     * // String.
     * matcher.add( 'div' );
     *
     * // Regular expression.
     * matcher.add( /^\w/ );
     *
     * // Single class.
     * matcher.add( {
     * 	classes: 'foobar'
     * } );
     * ```
     *
     * See {@link module:engine/view/matcher~MatcherPattern} for more examples.
     *
     * Multiple patterns can be added in one call:
     *
     * ```ts
     * matcher.add( 'div', { classes: 'foobar' } );
     * ```
     *
     * @param pattern Object describing pattern details. If string or regular expression
     * is provided it will be used to match element's name. Pattern can be also provided in a form
     * of a function - then this function will be called with each {@link module:engine/view/element~Element element} as a parameter.
     * Function's return value will be stored under `match` key of the object returned from
     * {@link module:engine/view/matcher~Matcher#match match} or {@link module:engine/view/matcher~Matcher#matchAll matchAll} methods.
     */
    add(...pattern) {
        for (let item of pattern) {
            // String or RegExp pattern is used as element's name.
            if (typeof item == 'string' || item instanceof RegExp) {
                item = { name: item };
            }
            this._patterns.push(item);
        }
    }
    /**
     * Matches elements for currently stored patterns. Returns match information about first found
     * {@link module:engine/view/element~Element element}, otherwise returns `null`.
     *
     * Example of returned object:
     *
     * ```ts
     * {
     * 	element: <instance of found element>,
     * 	pattern: <pattern used to match found element>,
     * 	match: {
     * 		name: true,
     * 		attributes: [ 'title', 'href' ],
     * 		classes: [ 'foo' ],
     * 		styles: [ 'color', 'position' ]
     * 	}
     * }
     * ```
     *
     * @see module:engine/view/matcher~Matcher#add
     * @see module:engine/view/matcher~Matcher#matchAll
     * @param element View element to match against stored patterns.
     */
    match(...element) {
        for (const singleElement of element) {
            for (const pattern of this._patterns) {
                const match = isElementMatching(singleElement, pattern);
                if (match) {
                    return {
                        element: singleElement,
                        pattern,
                        match
                    };
                }
            }
        }
        return null;
    }
    /**
     * Matches elements for currently stored patterns. Returns array of match information with all found
     * {@link module:engine/view/element~Element elements}. If no element is found - returns `null`.
     *
     * @see module:engine/view/matcher~Matcher#add
     * @see module:engine/view/matcher~Matcher#match
     * @param element View element to match against stored patterns.
     * @returns Array with match information about found elements or `null`. For more information
     * see {@link module:engine/view/matcher~Matcher#match match method} description.
     */
    matchAll(...element) {
        const results = [];
        for (const singleElement of element) {
            for (const pattern of this._patterns) {
                const match = isElementMatching(singleElement, pattern);
                if (match) {
                    results.push({
                        element: singleElement,
                        pattern,
                        match
                    });
                }
            }
        }
        return results.length > 0 ? results : null;
    }
    /**
     * Returns the name of the element to match if there is exactly one pattern added to the matcher instance
     * and it matches element name defined by `string` (not `RegExp`). Otherwise, returns `null`.
     *
     * @returns Element name trying to match.
     */
    getElementName() {
        if (this._patterns.length !== 1) {
            return null;
        }
        const pattern = this._patterns[0];
        const name = pattern.name;
        return (typeof pattern != 'function' && name && !(name instanceof RegExp)) ? name : null;
    }
}
/**
 * Returns match information if {@link module:engine/view/element~Element element} is matching provided pattern.
 * If element cannot be matched to provided pattern - returns `null`.
 *
 * @returns Returns object with match information or null if element is not matching.
 */
function isElementMatching(element, pattern) {
    // If pattern is provided as function - return result of that function;
    if (typeof pattern == 'function') {
        return pattern(element);
    }
    const match = {};
    // Check element's name.
    if (pattern.name) {
        match.name = matchName(pattern.name, element.name);
        if (!match.name) {
            return null;
        }
    }
    // Check element's attributes.
    if (pattern.attributes) {
        match.attributes = matchAttributes(pattern.attributes, element);
        if (!match.attributes) {
            return null;
        }
    }
    // Check element's classes.
    if (pattern.classes) {
        match.classes = matchClasses(pattern.classes, element);
        if (!match.classes) {
            return null;
        }
    }
    // Check element's styles.
    if (pattern.styles) {
        match.styles = matchStyles(pattern.styles, element);
        if (!match.styles) {
            return null;
        }
    }
    return match;
}
/**
 * Checks if name can be matched by provided pattern.
 *
 * @returns Returns `true` if name can be matched, `false` otherwise.
 */
function matchName(pattern, name) {
    // If pattern is provided as RegExp - test against this regexp.
    if (pattern instanceof RegExp) {
        return !!name.match(pattern);
    }
    return pattern === name;
}
/**
 * Checks if an array of key/value pairs can be matched against provided patterns.
 *
 * Patterns can be provided in a following ways:
 * - a boolean value matches any attribute with any value (or no value):
 *
 * ```ts
 * pattern: true
 * ```
 *
 * - a RegExp expression or object matches any attribute name:
 *
 * ```ts
 * pattern: /h[1-6]/
 * ```
 *
 * - an object matches any attribute that has the same name as the object item's key, where object item's value is:
 * 	- equal to `true`, which matches any attribute value:
 *
 * ```ts
 * pattern: {
 * 	required: true
 * }
 * ```
 *
 * 	- a string that is equal to attribute value:
 *
 * ```ts
 * pattern: {
 * 	rel: 'nofollow'
 * }
 * ```
 *
 * 	- a regular expression that matches attribute value,
 *
 * ```ts
 * pattern: {
 * 	src: /^https/
 * }
 * ```
 *
 * - an array with items, where the item is:
 * 	- a string that is equal to attribute value:
 *
 * ```ts
 * pattern: [ 'data-property-1', 'data-property-2' ],
 * ```
 *
 * 	- an object with `key` and `value` property, where `key` is a regular expression matching attribute name and
 * 		`value` is either regular expression matching attribute value or a string equal to attribute value:
 *
 * ```ts
 * pattern: [
 * 	{ key: /^data-property-/, value: true },
 * 	// or:
 * 	{ key: /^data-property-/, value: 'foobar' },
 * 	// or:
 * 	{ key: /^data-property-/, value: /^foo/ }
 * ]
 * ```
 *
 * @param patterns Object with information about attributes to match.
 * @param keys Attribute, style or class keys.
 * @param valueGetter A function providing value for a given item key.
 * @returns Returns array with matched attribute names or `null` if no attributes were matched.
 */
function matchPatterns(patterns, keys, valueGetter) {
    const normalizedPatterns = normalizePatterns(patterns);
    const normalizedItems = Array.from(keys);
    const match = [];
    normalizedPatterns.forEach(([patternKey, patternValue]) => {
        normalizedItems.forEach(itemKey => {
            if (isKeyMatched(patternKey, itemKey) &&
                isValueMatched(patternValue, itemKey, valueGetter)) {
                match.push(itemKey);
            }
        });
    });
    // Return matches only if there are at least as many of them as there are patterns.
    // The RegExp pattern can match more than one item.
    if (!normalizedPatterns.length || match.length < normalizedPatterns.length) {
        return undefined;
    }
    return match;
}
/**
 * Bring all the possible pattern forms to an array of arrays where first item is a key and second is a value.
 *
 * Examples:
 *
 * Boolean pattern value:
 *
 * ```ts
 * true
 * ```
 *
 * to
 *
 * ```ts
 * [ [ true, true ] ]
 * ```
 *
 * Textual pattern value:
 *
 * ```ts
 * 'attribute-name-or-class-or-style'
 * ```
 *
 * to
 *
 * ```ts
 * [ [ 'attribute-name-or-class-or-style', true ] ]
 * ```
 *
 * Regular expression:
 *
 * ```ts
 * /^data-.*$/
 * ```
 *
 * to
 *
 * ```ts
 * [ [ /^data-.*$/, true ] ]
 * ```
 *
 * Objects (plain or with `key` and `value` specified explicitly):
 *
 * ```ts
 * {
 * 	src: /^https:.*$/
 * }
 * ```
 *
 * or
 *
 * ```ts
 * [ {
 * 	key: 'src',
 * 	value: /^https:.*$/
 * } ]
 * ```
 *
 * to:
 *
 * ```ts
 * [ [ 'src', /^https:.*$/ ] ]
 * ```
 *
 * @returns Returns an array of objects or null if provided patterns were not in an expected form.
 */
function normalizePatterns(patterns) {
    if (Array.isArray(patterns)) {
        return patterns.map((pattern) => {
            if (isPlainObject(pattern)) {
                if (pattern.key === undefined || pattern.value === undefined) {
                    // Documented at the end of matcher.js.
                    logWarning('matcher-pattern-missing-key-or-value', pattern);
                }
                return [pattern.key, pattern.value];
            }
            // Assume the pattern is either String or RegExp.
            return [pattern, true];
        });
    }
    if (isPlainObject(patterns)) {
        return Object.entries(patterns);
    }
    // Other cases (true, string or regexp).
    return [[patterns, true]];
}
/**
 * @param patternKey A pattern representing a key we want to match.
 * @param itemKey An actual item key (e.g. `'src'`, `'background-color'`, `'ck-widget'`) we're testing against pattern.
 */
function isKeyMatched(patternKey, itemKey) {
    return patternKey === true ||
        patternKey === itemKey ||
        patternKey instanceof RegExp && itemKey.match(patternKey);
}
/**
 * @param patternValue A pattern representing a value we want to match.
 * @param itemKey An item key, e.g. `background`, `href`, 'rel', etc.
 * @param valueGetter A function used to provide a value for a given `itemKey`.
 */
function isValueMatched(patternValue, itemKey, valueGetter) {
    if (patternValue === true) {
        return true;
    }
    const itemValue = valueGetter(itemKey);
    // For now, the reducers are not returning the full tree of properties.
    // Casting to string preserves the old behavior until the root cause is fixed.
    // More can be found in https://github.com/ckeditor/ckeditor5/issues/10399.
    return patternValue === itemValue ||
        patternValue instanceof RegExp && !!String(itemValue).match(patternValue);
}
/**
 * Checks if attributes of provided element can be matched against provided patterns.
 *
 * @param patterns Object with information about attributes to match. Each key of the object will be
 * used as attribute name. Value of each key can be a string or regular expression to match against attribute value.
 * @param  element Element which attributes will be tested.
 * @returns Returns array with matched attribute names or `null` if no attributes were matched.
 */
function matchAttributes(patterns, element) {
    const attributeKeys = new Set(element.getAttributeKeys());
    // `style` and `class` attribute keys are deprecated. Only allow them in object pattern
    // for backward compatibility.
    if (isPlainObject(patterns)) {
        if (patterns.style !== undefined) {
            // Documented at the end of matcher.js.
            logWarning('matcher-pattern-deprecated-attributes-style-key', patterns);
        }
        if (patterns.class !== undefined) {
            // Documented at the end of matcher.js.
            logWarning('matcher-pattern-deprecated-attributes-class-key', patterns);
        }
    }
    else {
        attributeKeys.delete('style');
        attributeKeys.delete('class');
    }
    return matchPatterns(patterns, attributeKeys, key => element.getAttribute(key));
}
/**
 * Checks if classes of provided element can be matched against provided patterns.
 *
 * @param patterns Array of strings or regular expressions to match against element's classes.
 * @param element Element which classes will be tested.
 * @returns Returns array with matched class names or `null` if no classes were matched.
 */
function matchClasses(patterns, element) {
    // We don't need `getter` here because patterns for classes are always normalized to `[ className, true ]`.
    return matchPatterns(patterns, element.getClassNames(), /* istanbul ignore next -- @preserve */ () => { });
}
/**
 * Checks if styles of provided element can be matched against provided patterns.
 *
 * @param patterns Object with information about styles to match. Each key of the object will be
 * used as style name. Value of each key can be a string or regular expression to match against style value.
 * @param element Element which styles will be tested.
 * @returns Returns array with matched style names or `null` if no styles were matched.
 */
function matchStyles(patterns, element) {
    return matchPatterns(patterns, element.getStyleNames(true), key => element.getStyle(key));
}
/**
 * The key-value matcher pattern is missing key or value. Both must be present.
 * Refer the documentation: {@link module:engine/view/matcher~MatcherPattern}.
 *
 * @param pattern Pattern with missing properties.
 * @error matcher-pattern-missing-key-or-value
 */
/**
 * The key-value matcher pattern for `attributes` option is using deprecated `style` key.
 *
 * Use `styles` matcher pattern option instead:
 *
 * ```ts
 * // Instead of:
 * const pattern = {
 * 	attributes: {
 * 		key1: 'value1',
 * 		key2: 'value2',
 * 		style: /^border.*$/
 * 	}
 * }
 *
 * // Use:
 * const pattern = {
 * 	attributes: {
 * 		key1: 'value1',
 * 		key2: 'value2'
 * 	},
 * 	styles: /^border.*$/
 * }
 * ```
 *
 * Refer to the {@glink updating/guides/update-to-29##update-to-ckeditor-5-v2910 Migration to v29.1.0} guide
 * and {@link module:engine/view/matcher~MatcherPattern} documentation.
 *
 * @param pattern Pattern with missing properties.
 * @error matcher-pattern-deprecated-attributes-style-key
 */
/**
 * The key-value matcher pattern for `attributes` option is using deprecated `class` key.
 *
 * Use `classes` matcher pattern option instead:
 *
 * ```ts
 * // Instead of:
 * const pattern = {
 * 	attributes: {
 * 		key1: 'value1',
 * 		key2: 'value2',
 * 		class: 'foobar'
 * 	}
 * }
 *
 * // Use:
 * const pattern = {
 * 	attributes: {
 * 		key1: 'value1',
 * 		key2: 'value2'
 * 	},
 * 	classes: 'foobar'
 * }
 * ```
 *
 * Refer to the {@glink updating/guides/update-to-29##update-to-ckeditor-5-v2910 Migration to v29.1.0} guide
 * and the {@link module:engine/view/matcher~MatcherPattern} documentation.
 *
 * @param pattern Pattern with missing properties.
 * @error matcher-pattern-deprecated-attributes-class-key
 */
