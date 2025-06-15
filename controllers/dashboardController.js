const Product = require("../models/Product");
const Category = require("../models/Category");
const Customer = require("../models/Customer");
const StockMovement = require("../models/StockMovement");

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get total categories count
    const totalCategories = await Category.countDocuments();

    // Get low stock items count
    const lowStockItems = await Product.countDocuments({
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    });

    // Get total inventory value
    const products = await Product.find({}, "price stockQuantity");
    const totalValue = products.reduce((sum, product) => {
      return sum + product.price * product.stockQuantity;
    }, 0);

    // Get total customers count
    const totalCustomers = await Customer.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        lowStockItems,
        totalValue,
        totalCustomers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get recent stock movements
// @route   GET /api/dashboard/recent-movements
// @access  Private
exports.getRecentMovements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentMovements = await StockMovement.find()
      .sort({ date: -1 })
      .limit(limit)
      .populate("productId", "name sku")
      .populate("customerId", "name");

    res.status(200).json({
      success: true,
      count: recentMovements.length,
      data: recentMovements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/dashboard/low-stock
// @access  Private
exports.getLowStockProducts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc    Get stock movement summary by type (in/out)
// @route   GET /api/dashboard/movement-summary
// @access  Private
exports.getMovementSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date range filter
    const dateFilter = {};

    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }

    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Query parameters
    const matchStage =
      Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    // Aggregate stock movements by type
    const movementSummary = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Format the result
    const formattedSummary = {
      in: { totalQuantity: 0, count: 0 },
      out: { totalQuantity: 0, count: 0 },
    };

    movementSummary.forEach((item) => {
      formattedSummary[item._id] = {
        totalQuantity: item.totalQuantity,
        count: item.count,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
