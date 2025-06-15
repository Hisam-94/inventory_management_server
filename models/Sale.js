const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: [true, "Invoice ID is required"],
    unique: true,
    trim: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Customer ID is required"],
  },
  billingDate: {
    type: Date,
    required: [true, "Billing date is required"],
    default: Date.now,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Price cannot be negative"],
    },   
    sku: {
      type: String,
      trim: true,
    },
  }],
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, "Tax cannot be negative"],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be negative"],
  },
  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"],
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Cancelled", "Refunded"],
    default: "Pending",
    required: [true, "Status is required"],
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Cheque", "Online"],
    trim: true,
  },
  paymentDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true,
});

// Pre-save middleware to calculate totals
SaleSchema.pre("save", function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate total amount (subtotal + tax - discount)
  this.totalAmount = this.subtotal + (this.tax || 0) - (this.discount || 0);
  
  // Calculate total price for each item
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  next();
});

// Index for better query performance
SaleSchema.index({ invoiceId: 1 });
SaleSchema.index({ customerId: 1 });
SaleSchema.index({ billingDate: -1 });
SaleSchema.index({ status: 1 });

module.exports = mongoose.model("Sale", SaleSchema);