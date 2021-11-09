/*jshint esversion: 8 */

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = process.env.DB_URL;
db.datas = require("./data.model.js")(mongoose);

module.exports = db;