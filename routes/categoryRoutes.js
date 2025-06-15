const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
} = require("../controllers/categoryController");

// Get all categories and create new category
router.route("/").get(getCategories).post(createCategory);

// Get, update and delete category by ID
router
  .route("/:id")
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

// Get products by category
router.route("/:id/products").get(getCategoryProducts);

module.exports = router;
