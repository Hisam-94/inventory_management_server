const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

// Get all products and create new product
router.route("/").get(getProducts).post(createProduct);

// Get low stock products
router.route("/low-stock").get(getLowStockProducts);

// Get, update and delete product by ID
router.route("/:id").get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
