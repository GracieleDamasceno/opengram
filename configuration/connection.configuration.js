const dbConfig = require("./database.configuration.js");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const database = {};
database.mongoose = mongoose;
database.url = dbConfig.url;
database.opengram = require("../model/user.model.js")(mongoose);
module.exports = database;
