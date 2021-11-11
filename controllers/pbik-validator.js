/*jshint esversion: 6 */

/**
 *
 * @param {string} id - id of the element to validate  (required)
 * @returns {boolean} - true if valid, false if not
 */
const isValidID = (id) => {
    if (id.length > 7) {
        return false;
    }
    regex = new RegExp(/[1-9][0-9]{6}/);
    return regex.test(id);
};

module.exports = isValidID;
