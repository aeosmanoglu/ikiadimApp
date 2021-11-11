/*jshint esversion: 6 */

/**
 *
 * @param {*} mongoose - mongoose instance
 * @returns {object} - DataModel instance
 */
module.exports = (mongoose) => {
    const DataModel = mongoose.model(
        "data",
        mongoose.Schema(
            {
                pbik: String,
                iv: String,
                content: String,
            },
            { timestamps: true }
        )
    );

    return DataModel;
};
