const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRecentMovements,
  getLowStockProducts,
  getMovementSummary,
} = require("../controllers/dashboardController");

// Get dashboard stats
router.route("/stats").get(getDashboardStats);

// Get recent stock movements
router.route("/recent-movements").get(getRecentMovements);

// Get low stock products
router.route("/low-stock").get(getLowStockProducts);

// Get stock movement summary
router.route("/movement-summary").get(getMovementSummary);

module.exports = router;
