const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  product: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "client",
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  status: {
    type: String,
    default: "PENDING",
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("order", orderSchema);
