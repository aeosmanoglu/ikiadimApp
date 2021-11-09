/*jshint esversion: 8 */

const now = () => {
    let timeElapsed = Date.now();
    let today = new Date(timeElapsed);
    return today.toString();
};

module.exports = now;