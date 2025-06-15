const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomerStockAllocation,
  getCustomerStockAllocations,
  getAllCustomersStockAllocations,
} = require("../controllers/customerController");

// Get all customers and create new customer
router.route("/").get(getCustomers).post(createCustomer);

// Get, update and delete customer by ID
router
  .route("/:id")
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

  // Get All Customers stock allocations
router.route("/all/allocations").get(getAllCustomersStockAllocations);

// Customer stock allocations
router
  .route("/:id/allocations")
  .get(getCustomerStockAllocations)
  .post(createCustomerStockAllocation);

module.exports = router;
