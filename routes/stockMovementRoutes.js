const express = require("express");
const router = express.Router();
const {
  getStockMovements,
  getStockMovement,
  createStockMovement,
  getProductStockMovements,
} = require("../controllers/stockMovementController");

// Get all stock movements and create new stock movement
router.route("/").get(getStockMovements).post(createStockMovement);

// Get stock movement by ID
router.route("/:id").get(getStockMovement);

// Get stock movements by product
router.route("/product/:productId").get(getProductStockMovements);

module.exports = router;
