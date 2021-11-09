/*jshint esversion: 8 */

module.exports = mongoose => {
    const DataModel = mongoose.model(
        "data",
        mongoose.Schema({
            pbik: {
                type: Number,
                min: 1000000,
                max: 9999999,
                required: true
            },
            key: String,
        }, { timestamps: true })
    );

    return DataModel;
};