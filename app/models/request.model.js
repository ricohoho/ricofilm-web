const mongoose = require("mongoose");

const RequestModel = mongoose.model(
  "Request",
  new mongoose.Schema({
    file: String,
    path:String,
    size: Number,
    username: String,
    title: String,
    serveur_name: String,
    status: String
  }), "request"
);

module.exports = RequestModel;


/*
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ]
  })
);
module.exports = User;
*/