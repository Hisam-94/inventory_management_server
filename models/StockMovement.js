const mongoose = require("mongoose");

const StockMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  type: {
    type: String,
    enum: ["in", "out"],
    required: [true, "Movement type is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: 1,
  },
  reason: {
    type: String,
    required: [true, "Reason is required"],
    trim: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StockMovement", StockMovementSchema);
