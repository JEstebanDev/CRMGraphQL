const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true },
  createAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("user", userSchema);
