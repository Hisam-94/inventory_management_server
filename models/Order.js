const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  date: { type: Date, required: true },
  product: { type: String, required: true },
  model: { type: String },
  brand: { type: String },
  notes: { type: String },
  return: {
    type: Boolean,
    default: false,
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
  quantity: { type: Number, required: true },
  sellingPrice: { type: Number },
  costPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["delivered", "pending", "cancelled"],
    default: "Pending",
    required: true,
  },
  invoice: {
    name: { type: String },
    key: { type: String },
    url: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  totalAmount: { type: Number, required: true },
  payments: [paymentSchema],
  dueAmount: { type: Number, required: true },
});

orderSchema.virtual("paidAmount").get(function () {
  return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
