const Customer = require("../models/Customer");
const CustomerStockAllocation = require("../models/CustomerStockAllocation");
const Order = require("../models/Order");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const User = require("../models/User");

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const { search, sortBy, sortOrder } = req.query;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }

    const customers = await User.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    } else if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Customer with this email already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    } else if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Customer with this email already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Check if customer has stock allocations
    const allocationsCount = await CustomerStockAllocation.countDocuments({
      customerId: req.params.id,
    });

    if (allocationsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete customer with ${allocationsCount} stock allocations. Please remove these allocations first.`,
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Create customer stock allocation
// @route   POST /api/customers/:id/allocations
// @access  Private
exports.createCustomerStockAllocation = async (req, res) => {
  try {
    const { productId, quantity, deliveryAgent, notes } = req.body;
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
      notes,
      costPrice: product.price,
      totalAmount: product.price * quantity,
      dueAmount: product.price * quantity,
      deliveryAgent,
      status: "pending",
      payments: [],
      date: new Date(),
    };

    const order = new Order(orderData);
    await order.save();

    // const { description, sku, brand, model, category, price } = product;
    // // Create allocation
    // const allocation = await CustomerStockAllocation.create({
    //   customerId,
    //   productId,
    //   quantity,
    //   notes,
    //   description,
    //   sku,
    //   name: product.name,
    //   category,
    //   brand,
    //   model,
    //   cost:price,
    //   deliveryAgent,
    // });

    // Update product stock quantity
    await Product.findByIdAndUpdate(productId, {
      $inc: { stockQuantity: -quantity },
      updatedAt: Date.now(),
    });

    // Create stock movement record
    await StockMovement.create({
      productId,
      type: "out",
      quantity,
      reason: `Allocated to customer: ${customer.name}`,
      customerId,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    } else {
      console.log("error", error);
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
};

// @desc    Get customer stock allocations
// @route   GET /api/customers/:id/allocations
// @access  Private
exports.getCustomerStockAllocations = async (req, res) => {
  try {
    const customerId = req.params.id;

    // Validate customer exists
    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const allocations = await CustomerStockAllocation.find({ customerId })
      .sort({ date: -1 })
      .populate("name sku imageUrl");

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

exports.getAllCustomersStockAllocations = async (req, res) => {
  try {
    const allocations = await CustomerStockAllocation.find({}).sort({
      date: -1,
    });
    // .populate("productId", "name sku imageUrl");

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
