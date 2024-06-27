/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import priorities from './priorities.js';
/**
 * Inserts any object with priority at correct index by priority so registered objects are always sorted from highest to lowest priority.
 *
 * @param objects Array of objects with priority to insert object to.
 * @param objectToInsert Object with `priority` property.
 */
export default function insertToPriorityArray(objects, objectToInsert) {
    const priority = priorities.get(objectToInsert.priority);
    for (let i = 0; i < objects.length; i++) {
        if (priorities.get(objects[i].priority) < priority) {
            objects.splice(i, 0, objectToInsert);
            return;
        }
    }
    objects.push(objectToInsert);
}
