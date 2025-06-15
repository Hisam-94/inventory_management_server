const express = require("express");
const router = express.Router();
const {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesStats,
  getSalesByCustomerId
} = require("../controllers/salesController");

// Validation middleware (optional - you can add your own validation logic)
const validateSaleData = (req, res, next) => {
  const { invoiceId, customerId, items } = req.body;
  
  if (!invoiceId || typeof invoiceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: "Valid Invoice ID is required"
    });
  }
  
  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: "Customer ID is required"
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one item is required"
    });
  }
  
  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Product ID, name, quantity, and unit price are required`
      });
    }
    
    if (item.quantity <= 0 || item.unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Quantity must be positive and price cannot be negative`
      });
    }
  }
  
  next();
};

// Routes

/**
 * @route   POST /api/sales
 * @desc    Create a new sale
 * @access  Private
 * @body    { invoiceId, customerId, billingDate, items, tax, discount, status, paymentMethod, paymentDate, notes, createdBy }
 */
router.post("/", validateSaleData, createSale);

/**
 * @route   GET /api/sales
 * @desc    Get all sales with pagination and filtering
 * @access  Private
 * @query   page, limit, status, customerId, startDate, endDate, search, sortBy, sortOrder
 */
router.get("/", getAllSales);


/**
 * @route   GET /api/sales/customer/:customerId
 * @desc    Get sales by customer ID with pagination and filtering
 * @access  Private
 * @param   customerId - Customer ID
 * @query   page, limit, status, startDate, endDate, search, sortBy, sortOrder
 */
router.get("/customer/:customerId", getSalesByCustomerId);

/**
 * @route   GET /api/sales/stats
 * @desc    Get sales statistics
 * @access  Private
 * @query   startDate, endDate, customerId
 */
router.get("/stats", getSalesStats);

/**
 * @route   GET /api/sales/:id
 * @desc    Get sale by ID
 * @access  Private
 * @param   id - Sale ID
 */
router.get("/:id", getSaleById);

/**
 * @route   PUT /api/sales/:id
 * @desc    Update a sale
 * @access  Private
 * @param   id - Sale ID
 * @body    Updated sale data
 */
router.put("/:id", updateSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Delete a sale
 * @access  Private
 * @param   id - Sale ID
 */
router.delete("/:id", deleteSale);

module.exports = router;