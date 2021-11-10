/*jshint esversion: 8 */

let dotenv = require("dotenv");
dotenv.config();

let mongoose = require("mongoose");
mongoose.Promise = global.Promise;

let db = {};
db.mongoose = mongoose;
db.url = process.env.DB_URL;
db.datas = require("./data.model.js")(mongoose);

module.exports = db;