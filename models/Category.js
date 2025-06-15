const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  productCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a text index for search functionality
CategorySchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Category", CategorySchema);
