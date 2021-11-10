/*jshint esversion: 8 */

let now = () => {
    let timeElapsed = Date.now();
    let today = new Date(timeElapsed);
    return today.toString();
};

module.exports = now;