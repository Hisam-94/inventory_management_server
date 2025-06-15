const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

exports.createOrder = async (req, res) => {
  try {
    // Currently create order is handling from createCustomerStockAllocation endpoint in customerController
    // Currently create order is handling from createCustomerStockAllocation endpoint in customerController
    // Currently create order is handling from createCustomerStockAllocation endpoint in customerController
    // Currently create order is handling from createCustomerStockAllocation endpoint in customerController
    // Currently create order is handling from createCustomerStockAllocation endpoint in customerController
    
    const { productId, quantity, deliveryAgent } = req.body;
    const customerId = req.params.id;

    console.log("customerId", customerId);
    console.log("deliveryAgent", deliveryAgent);

    // Validate customer exists
    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Check if there's enough stock
    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock quantity",
      });
    }

    const orderData = {
      customerId,
      productId,
      product: product.name,
      model: product.model,
      brand: product.brand,
      quantity,
      totalAmount: product.price * quantity,
      dueAmount: product.price * quantity,
      deliveryAgent,
      status: "pending",
      payments: [],
      date: new Date(),
    };

    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order);
    
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
      search = "",
      status,
      brand,
      customerId,
    } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { product: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (brand) query.brand = brand;
    if (customerId) query.customerId = customerId;

    const orders = await Order.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    const summary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$payments.amount" },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      orders,
      summary: summary[0] || { totalAmount: 0, paidAmount: 0, dueAmount: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const {
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
      search = "",
      status,
      brand,
    } = req.query;

    const query = { customerId: new mongoose.Types.ObjectId(customerId) };

    if (search) {
      query.$or = [
        { product: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (brand) query.brand = brand;

    const orders = await Order.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    const summary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$payments.amount" },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      orders,
      summary: summary[0] || { totalAmount: 0, paidAmount: 0, dueAmount: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.payments.push({ amount, date });

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    order.dueAmount = Math.max(order.totalAmount - totalPaid, 0);

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
