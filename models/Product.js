const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
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
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0,
  },
  cost: {
    type: Number,
    required: [true, "Cost is required"],
    min: 0,
  },
  stockQuantity: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: 0,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    required: [true, "Reorder level is required"],
    min: 0,
    default: 5,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ProductSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for search functionality
ProductSchema.index({
  name: "text",
  description: "text",
  sku: "text",
  tags: "text",
});

module.exports = mongoose.model("Product", ProductSchema);
