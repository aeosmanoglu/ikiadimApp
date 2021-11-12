/*jshint esversion: 6 */

const validator = require('validator');

/**
 * @param {string} id - id of the element to validate  (required)
 * @returns {boolean} - true if valid, false if not
 */
const isValidID = (id) => {
    return validator.isInt(id, { min: 1000000, max: 9999999, allow_leading_zeroes: false });
    // console.log(escaped_id);
    // if (escaped_id.length > 7) {
    //     return false;
    // }
    // regex = new RegExp(/[1-9][0-9]{6}/);
    // return regex.test(escaped_id);
};

module.exports = isValidID;