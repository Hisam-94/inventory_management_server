const mongoose = require("mongoose");
const { use } = require("react");

const CustomerStockAllocationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer ID is required"],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: 1,
  },
  reorderLevel: {
    type: Number,
    min: 1,
  },
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    trim: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  cost: {
    type: Number,
    required: [true, "Cost is required"],
    min: 0,
  },
  deliveryAgent: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  notes: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "CustomerStockAllocation",
  CustomerStockAllocationSchema
);
