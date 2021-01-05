const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: String,
    gif: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
