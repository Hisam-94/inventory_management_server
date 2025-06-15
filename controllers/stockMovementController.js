const StockMovement = require("../models/StockMovement");
const Product = require("../models/Product");

// @desc    Get all stock movements
// @route   GET /api/stock-movements
// @access  Private
exports.getStockMovements = async (req, res) => {
  try {
    const { productId, customerId, type, startDate, endDate, limit } =
      req.query;

    // Build query
    const query = {};

    if (productId) {
      query.productId = productId;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (type && ["in", "out"].includes(type)) {
      query.type = type;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Build query with pagination
    let queryBuilder = StockMovement.find(query)
      .sort({ date: -1 }) // Sort by newest first
      // .populate("productId", "name sku")
      // .populate("customerId", "name email");

    // Apply limit if provided
    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    const stockMovements = await queryBuilder;

    res.status(200).json({
      success: true,
      count: stockMovements.length,
      data: stockMovements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get single stock movement
// @route   GET /api/stock-movements/:id
// @access  Private
exports.getStockMovement = async (req, res) => {
  try {
    const stockMovement = await StockMovement.findById(req.params.id)
      .populate("productId", "name sku")
      .populate("customerId", "name email");

    if (!stockMovement) {
      return res.status(404).json({
        success: false,
        error: "Stock movement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: stockMovement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Create new stock movement
// @route   POST /api/stock-movements
// @access  Private
exports.createStockMovement = async (req, res) => {
  try {
    const { productId, type, quantity, reason, customerId } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Create stock movement
    const stockMovement = await StockMovement.create({
      productId,
      type,
      quantity,
      reason,
      customerId: customerId || null,
    });

    // Update product stock quantity
    const stockChange = type === "in" ? quantity : -quantity;

    // Prevent negative stock if it's an outgoing movement
    if (type === "out" && product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: "Insufficient stock quantity",
      });
    }

    await Product.findByIdAndUpdate(productId, {
      $inc: { stockQuantity: stockChange },
      updatedAt: Date.now(),
    });

    res.status(201).json({
      success: true,
      data: stockMovement,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  }
};

// @desc    Get stock movements by product
// @route   GET /api/stock-movements/product/:productId
// @access  Private
exports.getProductStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const stockMovements = await StockMovement.find({ productId })
      .sort({ date: -1 })
      .populate("customerId", "name email");

    res.status(200).json({
      success: true,
      count: stockMovements.length,
      data: stockMovements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
