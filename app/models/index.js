const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const dbm = {};

dbm.mongoose = mongoose;

dbm.user = require("./user.model");
dbm.role = require("./role.model");

dbm.ROLES = ["user", "admin", "moderator"];

module.exports = dbm;
