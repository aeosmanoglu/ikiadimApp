/*jshint esversion: 8 */

module.exports = mongoose => {
    let DataModel = mongoose.model(
        "data",
        mongoose.Schema({
            pbik: String,
            iv: String,
            content: String,
        }, { timestamps: true })
    );

    return DataModel;
};