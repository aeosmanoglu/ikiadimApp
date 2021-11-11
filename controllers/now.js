/*jshint esversion: 6 */

/**
 *
 * @returns {string} - current date in format string
 */
const now = () => {
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    return today.toString();
};

module.exports = now;
