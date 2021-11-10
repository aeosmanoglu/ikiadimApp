/*jshint esversion: 8 */

const isValidID = (id = String) => {
    if (id.length > 7) {
        return false;
    }
    regex = new RegExp(/[1-9][0-9]{6}/);
    return regex.test(id);
};

module.exports = isValidID;